import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { EventDetailWithRelations } from "./types";

export type CalendarEvent =
  Database["public"]["Tables"]["calendar_events"]["Row"];

// Columns used by the calendar grid UI (CalendarGrid + CalendarWithQuickAdd).
const CALENDAR_GRID_COLS =
  "id, title, event_type, starts_at, ends_at, is_all_day, visibility, created_by, organization_id, division_id, location, description, ref_id, ref_type, created_at" as const;

// Columns used by the event detail page.
const CALENDAR_DETAIL_COLS =
  "id, title, event_type, starts_at, ends_at, visibility, location, description, created_by, organization_id" as const;

/**
 * Fetch calendar events for an org within a date range.
 * Used for the monthly calendar view.
 */
export async function listCalendarEvents(
  orgId: string,
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select(CALENDAR_GRID_COLS)
    .eq("organization_id", orgId)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true })
    .limit(200);

  if (error) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

/**
 * Fetch a single calendar event by ID.
 */
export async function getCalendarEvent(
  eventId: string,
): Promise<CalendarEvent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select(CALENDAR_DETAIL_COLS)
    .eq("id", eventId)
    .maybeSingle();
  if (error || !data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any;
}

/**
 * Fetch upcoming events (next 7 days) for the org.
 */
export async function listUpcomingEvents(
  orgId: string,
  limit = 10,
): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const weekLater = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("calendar_events")
    .select(CALENDAR_GRID_COLS)
    .eq("organization_id", orgId)
    .gte("starts_at", now)
    .lte("starts_at", weekLater)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

/**
 * Fetch event detail with all relations and comments
 */
export async function getEventDetailWithRelations(
  eventId: string,
): Promise<EventDetailWithRelations | null> {
  const supabase = await createClient();

  // Get event
  const { data: event } = await supabase
    .from("calendar_events")
    .select("id, title, event_type, starts_at, ends_at, is_all_day, visibility, location, description, created_by, organization_id, division_id, ref_id, ref_type, created_at, calendar_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventAny = event as any;

  // Get PIC profile
  let pic = null;
  if (eventAny.pic_user_id) {
    const { data: picData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", eventAny.pic_user_id)
      .maybeSingle();
    pic = picData as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  // Get comments (table may not exist yet — returns empty on error)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: comments } = await (supabase as any)
    .from("calendar_event_comments")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  // Get relations (table may not exist yet — returns empty on error)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: relations } = await (supabase as any)
    .from("calendar_event_relations")
    .select("*")
    .eq("event_id", eventId);

  return {
    ...event,
    pic,
    comments: comments ?? [],
    relations: relations ?? [],
  };
}

/**
 * Get current user's RSVP status for an event.
 */
export async function getMyRsvp(
  eventId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("calendar_event_rsvps")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.status ?? null;
}

/**
 * Get RSVP status counts for a calendar event.
 */
export async function getRsvpCounts(
  eventId: string,
): Promise<{ hadir: number; tentative: number; tidak_hadir: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("calendar_event_rsvps")
    .select("status")
    .eq("event_id", eventId);

  const counts = { hadir: 0, tentative: 0, tidak_hadir: 0 };
  for (const row of (data ?? []) as Array<{ status: string }>) {
    if (row.status === "hadir") counts.hadir++;
    else if (row.status === "tentative") counts.tentative++;
    else if (row.status === "tidak_hadir") counts.tidak_hadir++;
  }
  return counts;
}

export interface RsvpAttendee {
  user_id: string;
  status: string;
  name: string;
}

/**
 * Fetch RSVP attendee names for a calendar event.
 */
export async function getRsvpAttendees(eventId: string): Promise<RsvpAttendee[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("calendar_event_rsvps")
    .select("user_id, status, profiles(full_name, display_name)")
    .eq("event_id", eventId);

  return ((data ?? []) as Array<{ user_id: string; status: string; profiles: { full_name: string | null; display_name: string | null } | null }>).map((r) => ({
    user_id: r.user_id,
    status: r.status,
    name: r.profiles?.display_name ?? r.profiles?.full_name ?? "Anggota",
  }));
}

/**
 * Fetch comments for an event (for realtime updates)
 */
export async function getEventComments(
  eventId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("calendar_event_comments")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  return data ?? [];
}
