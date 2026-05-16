"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
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
 * Create a calendar event. Captain+ only (RLS enforced).
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgError || !org) return { ok: false, message: "Organisasi tidak ditemukan" };

  const { data: event, error } = await supabase
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

  revalidatePath(`/${orgSlug}/calendar`);
  return { ok: true, event };
}

/**
 * Update calendar event (full or partial)
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const { error } = await supabase
    .from("calendar_events")
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
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

  revalidatePath(`/${orgSlug}/calendar`);
  revalidatePath(`/${orgSlug}/calendar/${id}`);
  return { ok: true };
}

/**
 * Update single property of event with autosave
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { id, field, value } = parsed.data;

  const { error } = await supabase
    .from("calendar_events")
    .update({
      [field]: value,
      updated_at: new Date().toISOString(),
    })
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

  revalidatePath(`/${orgSlug}/calendar/${id}`);
  return { ok: true };
}

/**
 * Delete a calendar event. Captain+ or creator only (RLS enforced).
 */
export async function deleteCalendarEventAction(
  orgSlug: string,
  eventId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Anda tidak punya akses untuk menghapus event ini"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/calendar`);
  return { ok: true };
}

/**
 * Add comment to event
 */
export async function addEventCommentAction(
  orgSlug: string,
  eventId: string,
  body: string,
): Promise<ActionError | { ok: true; id: string }> {
  if (!body?.trim()) {
    return { ok: false, message: "Komentar tidak boleh kosong" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data: comment, error } = await supabase
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
          : error?.message ?? "Gagal menambah komentar",
    };
  }

  revalidatePath(`/${orgSlug}/calendar/${eventId}`);
  return { ok: true, id: comment.id };
}

/**
 * Delete comment
 */
export async function deleteEventCommentAction(
  orgSlug: string,
  eventId: string,
  commentId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("calendar_event_comments")
    .delete()
    .eq("id", commentId);

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
 * Reschedule event via drag & drop
 */
export async function dragRescheduleEventAction(
  orgSlug: string,
  eventId: string,
  newStartsAt: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Get original event to calculate duration
  const { data: event } = await supabase
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
      new Date(event.ends_at).getTime() -
      new Date(event.starts_at).getTime();
    newEndsAt = new Date(new Date(newStartsAt).getTime() + duration).toISOString();
  }

  const { error } = await supabase
    .from("calendar_events")
    .update({
      starts_at: newStartsAt,
      ends_at: newEndsAt,
      updated_at: new Date().toISOString(),
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
