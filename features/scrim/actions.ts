"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blastWaMessage } from "@/lib/utils/fonnte";
import { logAudit } from "@/lib/audit";
import { buildScrimWaMessage } from "@/lib/utils/wa-templates";
import {
  cancelScrimSchema,
  createScrimSchema,
  submitResultSchema,
  updateAttendanceSchema,
  updateScrimSchema,
} from "@/lib/validations/scrim";
import type { Database } from "@/types/database";

type Scrim = Database["public"]["Tables"]["scrims"]["Row"];

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface CreateScrimResult {
  ok: true;
  scrim: Scrim;
}

/**
 * Create a scrim. The current user becomes `created_by`. A WA-blast
 * notification row is fanned out to every active member of the scrim's
 * division so the existing pg_cron Edge Function can deliver them.
 *
 * RLS gates the underlying INSERT to captain+ for the org; we surface a
 * friendly error if the policy rejects.
 */
export async function createScrimAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | CreateScrimResult> {
  const parsed = createScrimSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgError || !org) return { ok: false, message: "Organisasi tidak ditemukan" };

  // Parse datetime-local string as WIB (UTC+7) — browser sends localtime
  // without timezone suffix; appending +07:00 prevents the server (UTC)
  // from double-shifting the time by 7 hours.
  const scheduledAtUtc = new Date(parsed.data.scheduled_at + ":00+07:00").toISOString();
  const isPast = new Date(scheduledAtUtc) < new Date();

  const { data: scrim, error } = await supabase
    .from("scrims")
    .insert({
      organization_id: org.id,
      division_id: parsed.data.division_id,
      created_by: user.id,
      opponent_name: parsed.data.opponent_name,
      opponent_contact: parsed.data.opponent_contact,
      scheduled_at: scheduledAtUtc,
      format: parsed.data.format,
      server_region: parsed.data.server_region,
      room_info: parsed.data.room_info,
      notes: parsed.data.notes,
      patch: parsed.data.patch ?? null,
      // Historical scrims are created as completed immediately
      status: isPast ? "completed" : "scheduled",
      reminder_sent_at: isPast ? new Date().toISOString() : null,
      h24_reminder_sent_at: isPast ? new Date().toISOString() : null,
      h60_reminder_sent_at: isPast ? new Date().toISOString() : null,
      h7_reminder_sent_at: isPast ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error || !scrim) {
    return {
      ok: false,
      message:
        error?.code === "42501"
          ? "Hanya captain atau owner yang bisa membuat scrim"
          : (error?.message ?? "Gagal membuat scrim"),
    };
  }

  await logAudit({
    actorId: user.id,
    action: "scrim.create",
    entityType: "scrim",
    entityId: scrim.id,
    metadata: { opponent: scrim.opponent_name, format: scrim.format },
  });

  // Skip WA blast for past scrims, and for scrims >7 days away
  // (those will get an H-7 reminder from the cron job instead).
  if (!isPast) {
    const daysUntilScrim = (new Date(scheduledAtUtc).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilScrim <= 7) {
      await fanOutScrimNotifications(supabase, scrim, org.name);
    }
    // else: H-7 cron will send the WA blast when the time comes
  }

  revalidatePath(`/${orgSlug}/scrim`);
  revalidatePath(`/${orgSlug}`);
  return { ok: true, scrim };
}

async function fanOutScrimNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  scrim: Scrim,
  orgName: string,
) {
  // Use admin client to bypass RLS — we need to read all members & profiles
  const admin = createAdminClient();

  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", scrim.organization_id)
    .eq("is_active", true)
    .limit(500);
  if (!members || members.length === 0) return;

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, phone_wa")
    .in("id", userIds);
  const phoneMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.phone_wa]),
  );

  // This string ends up in the WhatsApp message body. Pin WIB explicitly
  // so cloud runtimes (UTC) don't push the displayed time 7 hours back.
  const scheduled = new Date(scrim.scheduled_at).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  const title = `Scrim baru: vs ${scrim.opponent_name}`;
  const body = `${orgName} menjadwalkan scrim ${scrim.format.toUpperCase()} pada ${scheduled}.`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const orgSlug = await getOrgSlugById(supabase, scrim.organization_id);
  const scrimUrl = `${appUrl}/${orgSlug}/scrim/${scrim.id}`;

  const waMessage = buildScrimWaMessage({
    orgName,
    opponentName: scrim.opponent_name,
    scheduledAt: scrim.scheduled_at,
    format: scrim.format,
    serverRegion: scrim.server_region,
    roomInfo: scrim.room_info,
    notes: scrim.notes,
    scrimUrl,
  });

  const rows = members.map((m) => ({
    organization_id: scrim.organization_id,
    user_id: m.user_id,
    type: "scrim_invite" as const,
    title,
    body,
    ref_id: scrim.id,
    ref_type: "scrim",
    wa_number: phoneMap.get(m.user_id) ?? null,
    wa_message: phoneMap.get(m.user_id) ? waMessage : null,
  }));

  // Best-effort: the scrim insert is the source of truth; notification
  // failures shouldn't block the captain.
  await admin.from("notifications").insert(rows);

  // Real-time WA blast — send immediately to members with phone numbers
  const recipients = members
    .map((m) => ({ phone: phoneMap.get(m.user_id), message: waMessage }))
    .filter((r): r is { phone: string; message: string } => Boolean(r.phone));

  if (recipients.length > 0) {
    // Fire-and-forget: don't await to avoid blocking the response
    blastWaMessage(recipients).catch((err) =>
      console.error("[WA Blast] Scrim notification error:", err),
    );
  }
}

async function getOrgSlugById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .maybeSingle();
  return data?.slug ?? "";
}

/**
 * Member's own RSVP for a scrim. Optimistic UI is provided client-side;
 * we just persist and revalidate here.
 */
export async function updateAttendanceAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updateAttendanceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Input tidak valid",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("scrim_attendances")
    .upsert(
      {
        scrim_id: parsed.data.scrim_id,
        user_id: user.id,
        status: parsed.data.status,
        note: parsed.data.note,
      },
      { onConflict: "scrim_id,user_id" },
    );
  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Anda harus menjadi member tim untuk konfirmasi kehadiran"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/scrim/${parsed.data.scrim_id}`);
  revalidatePath(`/${orgSlug}`);
  return { ok: true };
}

/**
 * Submit (or update) the scrim result and mark the scrim completed.
 */
export async function submitResultAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = submitResultSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error: resultError } = await supabase.from("scrim_results").upsert(
    {
      scrim_id: parsed.data.scrim_id,
      our_score: parsed.data.our_score,
      opponent_score: parsed.data.opponent_score,
      is_win: parsed.data.is_win ?? null,
      notes: parsed.data.notes,
      performance_rating: parsed.data.performance_rating ?? null,
      result_image_path: parsed.data.result_image_path ?? null,
      recorded_by: user.id,
    },
    { onConflict: "scrim_id" },
  );
  if (resultError) {
    return {
      ok: false,
      message:
        resultError.code === "42501"
          ? "Hanya captain atau owner yang bisa mencatat hasil"
          : resultError.message,
    };
  }

  // Don't resurrect a cancelled scrim. If a captain submits a result
  // on a row that was cancelled (e.g. via a stale tab), we keep the
  // result row for audit but leave the scrim as cancelled.
  const { error: scrimError } = await supabase
    .from("scrims")
    .update({ status: "completed" })
    .eq("id", parsed.data.scrim_id)
    .neq("status", "cancelled");
  if (scrimError) {
    return { ok: false, message: scrimError.message };
  }

  revalidatePath(`/${orgSlug}/scrim/${parsed.data.scrim_id}`);
  revalidatePath(`/${orgSlug}/scrim`);
  revalidatePath(`/${orgSlug}`);
  return { ok: true };
}

/**
 * Cancel a scheduled or ongoing scrim. Captain+ only (RLS enforced).
 */
export async function cancelScrimAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = cancelScrimSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Input tidak valid" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Preserve any existing notes (room info, strategic plans, etc.)
  // by prepending the cancellation marker rather than replacing.
  const { data: existing } = await supabase
    .from("scrims")
    .select("notes")
    .eq("id", parsed.data.scrim_id)
    .maybeSingle();
  const marker = parsed.data.reason
    ? `[CANCELLED] ${parsed.data.reason}`
    : "[CANCELLED]";
  const combinedNotes = existing?.notes
    ? `${marker}\n\n${existing.notes}`
    : marker;
  // Only allow cancelling scrims that are still actionable — guard against
  // reverting a completed scrim and against re-cancelling (which would
  // accumulate duplicate [CANCELLED] markers in notes). .select() lets us
  // detect a zero-row update so we can surface a clear error if the scrim
  // was already finalized in another tab.
  const { data: updated, error } = await supabase
    .from("scrims")
    .update({ status: "cancelled", notes: combinedNotes })
    .eq("id", parsed.data.scrim_id)
    .in("status", ["scheduled", "ongoing"])
    .select("id");
  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa membatalkan scrim"
          : error.message,
    };
  }
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      message: "Scrim sudah selesai atau sudah dibatalkan",
    };
  }

  await logAudit({
    actorId: user.id,
    action: "scrim.cancel",
    entityType: "scrim",
    entityId: parsed.data.scrim_id,
  });

  // Fan-out WA cancel notification (best-effort)
  const admin = createAdminClient();
  const { data: scrimRow } = await admin
    .from("scrims")
    .select("opponent_name, scheduled_at, format, organization_id")
    .eq("id", parsed.data.scrim_id)
    .maybeSingle();
  if (scrimRow) {
    const { data: orgRow } = await admin
      .from("organizations")
      .select("name")
      .eq("id", scrimRow.organization_id)
      .maybeSingle();
    if (orgRow) {
      fanOutScrimCancelNotification(
        parsed.data.scrim_id,
        scrimRow.organization_id,
        orgRow.name,
        scrimRow.opponent_name,
        scrimRow.scheduled_at,
        scrimRow.format,
        parsed.data.reason ?? null,
      ).catch((err) => console.error("[Scrim Cancel Notification]", err));
    }
  }

  revalidatePath(`/${orgSlug}/scrim/${parsed.data.scrim_id}`);
  revalidatePath(`/${orgSlug}/scrim`);
  return { ok: true };
}

export interface UpdateScrimResult {
  ok: true;
}

/**
 * Update an existing scrim's details. Captain+ only (RLS enforced).
 * `scheduled_at` arrives as a WIB datetime-local string and is converted to
 * UTC ISO before storage.
 */
export async function updateScrimAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | UpdateScrimResult> {
  const parsed = updateScrimSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Parse datetime-local string as WIB (UTC+7) to avoid double-shift.
  const scheduledAtUtc = new Date(parsed.data.scheduled_at + ":00+07:00").toISOString();

  const { data: updatedScrim, error } = await supabase
    .from("scrims")
    .update({
      division_id: parsed.data.division_id,
      scheduled_at: scheduledAtUtc,
      opponent_name: parsed.data.opponent_name,
      opponent_contact: parsed.data.opponent_contact,
      format: parsed.data.format,
      server_region: parsed.data.server_region,
      room_info: parsed.data.room_info,
      notes: parsed.data.notes,
      patch: parsed.data.patch ?? null,
    })
    .eq("id", parsed.data.scrim_id)
    .select("*")
    .single();

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa mengedit scrim"
          : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "scrim.update",
    entityType: "scrim",
    entityId: parsed.data.scrim_id,
  });

  // Fan-out update notification to members (best-effort, fire-and-forget)
  if (updatedScrim) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("slug", orgSlug)
      .maybeSingle();
    if (org) {
      fanOutScrimUpdateNotification(updatedScrim, org.name).catch((err) =>
        console.error("[Scrim Update Notification]", err),
      );
    }
  }

  revalidatePath(`/${orgSlug}/scrim/${parsed.data.scrim_id}`);
  revalidatePath(`/${orgSlug}/scrim`);
  revalidatePath(`/${orgSlug}`);
  return { ok: true };
}

async function fanOutScrimUpdateNotification(scrim: Scrim, orgName: string) {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", scrim.organization_id)
    .eq("is_active", true)
    .limit(500);
  if (!members || members.length === 0) return;

  const scheduled = new Date(scrim.scheduled_at).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  const title = `Scrim diperbarui: vs ${scrim.opponent_name}`;
  const body = `Jadwal scrim ${scrim.format.toUpperCase()} diperbarui menjadi ${scheduled}.`;

  const rows = members.map((m) => ({
    organization_id: scrim.organization_id,
    user_id: m.user_id,
    type: "scrim_invite" as const,
    title,
    body,
    ref_id: scrim.id,
    ref_type: "scrim",
    wa_number: null,
    wa_message: null,
  }));

  await admin.from("notifications").insert(rows);
}

/**
 * Fan out a cancellation notification (in-app bell + WA) to all active org
 * members when a scrim is cancelled.
 */
async function fanOutScrimCancelNotification(
  scrimId: string,
  organizationId: string,
  orgName: string,
  opponentName: string,
  scheduledAt: string,
  format: string,
  reason: string | null,
) {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .limit(500);
  if (!members || members.length === 0) return;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, phone_wa")
    .in("id", members.map((m) => m.user_id));
  const phoneMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.phone_wa]),
  );

  const scheduled = new Date(scheduledAt).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  const title = `Scrim dibatalkan: vs ${opponentName}`;
  const body = reason
    ? `Scrim ${format.toUpperCase()} vs ${opponentName} (${scheduled}) dibatalkan. Alasan: ${reason}`
    : `Scrim ${format.toUpperCase()} vs ${opponentName} (${scheduled}) dibatalkan.`;
  const waMessage = [
    `❌ [${orgName}] Scrim Dibatalkan`,
    ``,
    `*Lawan:* ${opponentName}`,
    `*Jadwal:* ${scheduled} WIB`,
    `*Format:* ${format.toUpperCase()}`,
    reason ? `*Alasan:* ${reason}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const rows = members.map((m) => ({
    organization_id: organizationId,
    user_id: m.user_id,
    type: "scrim_invite" as const,
    title,
    body,
    ref_id: scrimId,
    ref_type: "scrim",
    wa_number: phoneMap.get(m.user_id) ?? null,
    wa_message: phoneMap.get(m.user_id) ? waMessage : null,
  }));

  await admin.from("notifications").insert(rows);

  // Immediate WA blast
  const recipients = members
    .map((m) => ({ phone: phoneMap.get(m.user_id), message: waMessage }))
    .filter((r): r is { phone: string; message: string } => Boolean(r.phone));
  if (recipients.length > 0) {
    blastWaMessage(recipients).catch((err) =>
      console.error("[WA Blast] Cancel notification error:", err),
    );
  }
}

/**
 * Request a coach review for a scrim. Any authenticated member can request.
 * Fans out bell + WA notifications to all active coaches in the org.
 */
export async function requestScrimReviewAction(
  orgSlug: string,
  scrimId: string,
  notes?: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Resolve org id from slug
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { ok: false, message: "Organisasi tidak ditemukan" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("scrim_review_requests").insert({
    scrim_id: scrimId,
    requested_by: user.id,
    notes: notes?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Review sudah diminta sebelumnya" };
    }
    return { ok: false, message: error.message };
  }

  // Best-effort: fan out bell + WA to coaches
  try {
    const admin = createAdminClient();
    const { data: coaches } = await admin
      .from("team_members")
      .select("user_id")
      .eq("organization_id", org.id)
      .eq("role", "coach")
      .eq("is_active", true);

    if (coaches && coaches.length > 0) {
      const coachIds = coaches.map((c) => c.user_id);
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, phone_wa")
        .in("id", coachIds);
      const phoneMap = new Map(
        (profiles ?? []).map((p) => [p.id, p.phone_wa]),
      );

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const scrimUrl = `${appUrl}/${orgSlug}/scrim/${scrimId}`;
      const title = `Review scrim diminta`;
      const body = `Seseorang meminta review scrim. Cek detail dan tulis catatanmu.`;
      const waText = `*[${org.name}] Review Scrim Diminta*\n\nSeseorang meminta review untuk scrim. Buka link berikut untuk menulis catatanmu:\n${scrimUrl}`;

      const rows = coaches.map((c) => ({
        organization_id: org.id,
        user_id: c.user_id,
        type: "scrim_invite" as const,
        title,
        body,
        ref_id: scrimId,
        ref_type: "scrim",
        wa_number: phoneMap.get(c.user_id) ?? null,
        wa_message: phoneMap.get(c.user_id) ? waText : null,
      }));

      await admin.from("notifications").insert(rows);
    }
  } catch {
    // Non-blocking — review request already created above
  }

  revalidatePath(`/${orgSlug}/scrim/${scrimId}`);
  return { ok: true };
}

/**
 * Coach submits review notes and marks the request as reviewed.
 */
export async function submitScrimReviewAction(
  orgSlug: string,
  scrimId: string,
  reviewNotes: string,
): Promise<ActionError | { ok: true }> {
  if (!reviewNotes?.trim()) {
    return { ok: false, message: "Catatan review wajib diisi" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("scrim_review_requests")
    .update({
      status: "reviewed",
      review_notes: reviewNotes.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("scrim_id", scrimId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/scrim/${scrimId}`);
  return { ok: true };
}

export async function createScrimFormAction(
  orgSlug: string,
  formData: FormData,
): Promise<void | ActionError> {
  const raw = {
    division_id: formData.get("division_id"),
    opponent_name: formData.get("opponent_name"),
    opponent_contact: formData.get("opponent_contact"),
    scheduled_at: formData.get("scheduled_at"),
    format: formData.get("format"),
    server_region: formData.get("server_region"),
    room_info: formData.get("room_info"),
    notes: formData.get("notes"),
    patch: formData.get("patch"),
  };
  const res = await createScrimAction(orgSlug, raw);
  if (!res.ok) return res;
  redirect(`/${orgSlug}/scrim/${res.scrim.id}`);
}
