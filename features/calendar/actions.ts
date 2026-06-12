"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
  updateEventPropertySchema,
} from "@/lib/validations/calendar";
import type { Database } from "@/types/database";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface CreateEventResult {
  ok: true;
  event: CalendarEvent;
}

/**
 * Returns { user, db } where db = admin client if user is owner (bypasses RLS),
 * or regular supabase client otherwise.
 * Owner is determined by OWNER_EMAIL env var — never by team_members table.
 */
async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, db: supabase, isOwner: false };

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);

  // Owner uses admin client to bypass RLS (owner may not be in team_members)
  const db = isOwner ? createAdminClient() : supabase;

  return { user, db, isOwner };
}

/**
 * Create a calendar event.
 * Owner: always allowed (uses admin client).
 * Captain / Manager: allowed via RLS.
 * Member / Coach: blocked.
 */
export async function createCalendarEventAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | CreateEventResult> {
  const parsed = createCalendarEventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { user, db } = await getAuthContext();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data: org, error: orgError } = await db
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgError || !org)
    return { ok: false, message: "Organisasi tidak ditemukan" };

  const { data: event, error } = await db
    .from("calendar_events")
    .insert({
      organization_id: org.id,
      division_id: parsed.data.division_id,
      created_by: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      event_type: parsed.data.event_type,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: parsed.data.ends_at
        ? new Date(parsed.data.ends_at).toISOString()
        : null,
      is_all_day: parsed.data.is_all_day,
      location: parsed.data.location,
      visibility: parsed.data.visibility,
    })
    .select("*")
    .single();

  if (error || !event) {
    return {
      ok: false,
      message:
        error?.code === "42501"
          ? "Hanya captain atau owner yang bisa membuat event"
          : (error?.message ?? "Gagal membuat event"),
    };
  }

  // Fan-out bell notifications (fire-and-forget)
  fanOutCalendarNotifications(event, user.id, org.name, org.id).catch((e) =>
    console.error("[calendar] fanOut error:", e),
  );

  await logAudit({
    actorId: user.id,
    action: "calendar_event.create",
    entityType: "calendar_event",
    entityId: event.id,
    metadata: { title: event.title, orgId: org.id },
  });

  revalidatePath(`/${orgSlug}/calendar`);
  revalidatePath(`/dashboard/calendar`);
  return { ok: true, event };
}

async function fanOutCalendarNotifications(
  event: CalendarEvent,
  creatorId: string,
  orgName: string,
  orgId: string,
): Promise<void> {
  if (event.visibility === "private") return;

  const admin = createAdminClient();

  type MemberRole = "owner" | "captain" | "member" | "coach" | "manager";
  const roleFilter: MemberRole[] =
    event.visibility === "management"
      ? ["manager"]
      : event.visibility === "coach_up"
        ? ["coach", "manager"]
        : ["manager", "coach", "captain", "member"];

  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .in("role", roleFilter)
    .neq("user_id", creatorId)
    .limit(200);

  if (!members || members.length === 0) return;

  const TYPE_LABELS: Record<string, string> = {
    practice: "Latihan",
    meeting: "Meeting",
    tournament: "Turnamen",
    bootcamp: "Bootcamp",
    other: "Event",
  };
  const typeLabel = TYPE_LABELS[event.event_type] ?? "Event";

  const startsAt = new Date(event.starts_at);
  const dateStr = startsAt.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const timeStr = startsAt.toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  });

  const title = `[${orgName}] ${typeLabel}: ${event.title}`;
  const body = event.is_all_day
    ? dateStr
    : `${dateStr} · ${timeStr} WIB${event.location ? ` · ${event.location}` : ""}`;

  const rows = members.map((m) => ({
    organization_id: orgId,
    user_id: m.user_id,
    type: "system" as const,
    title,
    body,
    ref_id: event.id,
    ref_type: "calendar",
  }));

  await admin.from("notifications").insert(rows);
}

/**
 * Update calendar event (full or partial).
 */
export async function updateCalendarEventAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updateCalendarEventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Data tidak valid",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { user, db } = await getAuthContext();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { id, ...updates } = parsed.data;
  const updateData = Object.fromEntries(
    Object.entries(updates)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, v]),
  );

  if (Object.keys(updateData).length === 0) {
    return { ok: true };
  }

  const { error } = await db
    .from("calendar_events")
    .update(updateData as import("@/types/database").Database["public"]["Tables"]["calendar_events"]["Update"])
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Anda tidak punya akses untuk mengedit event ini"
          : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "calendar_event.update",
    entityType: "calendar_event",
    entityId: id,
    metadata: { fields: Object.keys(updateData) },
  });

  revalidatePath(`/${orgSlug}/calendar`);
  revalidatePath(`/${orgSlug}/calendar/${id}`);
  return { ok: true };
}

/**
 * Update single property of event with autosave.
 */
export async function updateEventPropertyAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updateEventPropertySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Field tidak valid",
    };
  }

  const { user, db } = await getAuthContext();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { id, field, value } = parsed.data;

  const { error } = await db
    .from("calendar_events")
    .update({ [field]: value } as import("@/types/database").Database["public"]["Tables"]["calendar_events"]["Update"])
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Anda tidak punya akses untuk mengubah field ini"
          : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "calendar_event.update",
    entityType: "calendar_event",
    entityId: id,
    metadata: { field },
  });

  revalidatePath(`/${orgSlug}/calendar/${id}`);
  return { ok: true };
}

/**
 * Delete a calendar event. Captain+ or creator only.
 * Owner always allowed.
 */
export async function deleteCalendarEventAction(
  orgSlug: string,
  eventId: string,
): Promise<ActionError | { ok: true }> {
  const { user, db } = await getAuthContext();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await db.from("calendar_events").delete().eq("id", eventId);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Anda tidak punya akses untuk menghapus event ini"
          : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "calendar_event.delete",
    entityType: "calendar_event",
    entityId: eventId,
  });

  revalidatePath(`/${orgSlug}/calendar`);
  revalidatePath(`/dashboard/calendar`);
  return { ok: true };
}

/**
 * Add comment to event.
 */
export async function addEventCommentAction(
  orgSlug: string,
  eventId: string,
  body: string,
): Promise<ActionError | { ok: true; id: string }> {
  if (!body?.trim()) {
    return { ok: false, message: "Komentar tidak boleh kosong" };
  }

  const { user, db } = await getAuthContext();
  if (!user) return { ok: false, message: "Anda harus login" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: comment, error } = await (db as any)
    .from("calendar_event_comments")
    .insert({
      event_id: eventId,
      user_id: user.id,
      body: body.trim(),
    })
    .select("id")
    .single();

  if (error || !comment) {
    return {
      ok: false,
      message:
        error?.code === "42501"
          ? "Anda tidak punya akses untuk menambah komentar"
          : (error?.message ?? "Gagal menambah komentar"),
    };
  }

  revalidatePath(`/${orgSlug}/calendar/${eventId}`);
  return { ok: true, id: comment.id };
}

/**
 * Delete comment. Users can only delete their own (or owner can delete any).
 */
export async function deleteEventCommentAction(
  orgSlug: string,
  eventId: string,
  commentId: string,
): Promise<ActionError | { ok: true }> {
  const { user, db, isOwner } = await getAuthContext();
  if (!user) return { ok: false, message: "Anda harus login" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = (db as any).from("calendar_event_comments").delete().eq("id", commentId);

  // Non-owner can only delete their own comments
  const { error } = isOwner ? await query : await query.eq("user_id", user.id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Anda hanya bisa menghapus komentar sendiri"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/calendar/${eventId}`);
  return { ok: true };
}

/**
 * Upsert RSVP for current user on a calendar event.
 */
export async function upsertCalendarRsvpAction(
  orgSlug: string,
  eventId: string,
  status: "hadir" | "tidak_hadir" | "tentative",
): Promise<ActionError | { ok: true }> {
  const { user, db } = await getAuthContext();
  if (!user) return { ok: false, message: "Anda harus login" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any)
    .from("calendar_event_rsvps")
    .upsert(
      { event_id: eventId, user_id: user.id, status },
      { onConflict: "event_id,user_id" },
    );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/${orgSlug}/calendar/${eventId}`);
  return { ok: true };
}

/**
 * Reschedule event via drag & drop. Captain+ or owner.
 */
export async function dragRescheduleEventAction(
  orgSlug: string,
  eventId: string,
  newStartsAt: string,
): Promise<ActionError | { ok: true }> {
  const { user, db } = await getAuthContext();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Get original event to calculate duration
  const { data: event } = await db
    .from("calendar_events")
    .select("starts_at, ends_at")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return { ok: false, message: "Event tidak ditemukan" };
  }

  let newEndsAt = null;
  if (event.ends_at) {
    const duration =
      new Date(event.ends_at).getTime() - new Date(event.starts_at).getTime();
    newEndsAt = new Date(
      new Date(newStartsAt).getTime() + duration,
    ).toISOString();
  }

  const { error } = await db
.from("calendar_events")
.update({
  starts_at: newStartsAt,
  ends_at: newEndsAt,
})
.eq("id", eventId);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Anda tidak punya akses untuk mengubah event ini"
          : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "calendar_event.reschedule",
    entityType: "calendar_event",
    entityId: eventId,
    metadata: { newStartsAt },
  });

  revalidatePath(`/${orgSlug}/calendar`);
  return { ok: true };
}
