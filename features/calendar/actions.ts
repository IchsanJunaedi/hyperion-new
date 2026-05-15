"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createCalendarEventSchema } from "@/lib/validations/calendar";
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
