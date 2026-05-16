"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blastWaMessage } from "@/lib/utils/fonnte";
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

  const { data: scrim, error } = await supabase
    .from("scrims")
    .insert({
      organization_id: org.id,
      division_id: parsed.data.division_id,
      created_by: user.id,
      opponent_name: parsed.data.opponent_name,
      opponent_contact: parsed.data.opponent_contact,
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      format: parsed.data.format,
      server_region: parsed.data.server_region,
      room_info: parsed.data.room_info,
      notes: parsed.data.notes,
      reminder_sent_at: null,
      h24_reminder_sent_at: null,
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

  await fanOutScrimNotifications(supabase, scrim, org.name);

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
    .eq("is_active", true);
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

  const { error } = await supabase
    .from("scrims")
    .update({
      division_id: parsed.data.division_id,
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      opponent_name: parsed.data.opponent_name,
      opponent_contact: parsed.data.opponent_contact,
      format: parsed.data.format,
      server_region: parsed.data.server_region,
      room_info: parsed.data.room_info,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.scrim_id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa mengedit scrim"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/scrim/${parsed.data.scrim_id}`);
  revalidatePath(`/${orgSlug}/scrim`);
  revalidatePath(`/${orgSlug}`);
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
  };
  const res = await createScrimAction(orgSlug, raw);
  if (!res.ok) return res;
  redirect(`/${orgSlug}/scrim/${res.scrim.id}`);
}
