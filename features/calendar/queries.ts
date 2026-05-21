import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { EventDetailWithRelations, CalendarEventComment } from "./types";

export type CalendarEvent =
  Database["public"]["Tables"]["calendar_events"]["Row"];

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
    .select("*")
    .eq("organization_id", orgId)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true });

  if (error) return [];
  return data ?? [];
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
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
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
    .select("*")
    .eq("organization_id", orgId)
    .gte("starts_at", now)
    .lte("starts_at", weekLater)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  return data ?? [];
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
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return null;

  // Get PIC profile
  let pic = null;
  if (event.pic_user_id) {
    const { data: picData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", event.pic_user_id)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pic = picData as any;
  }

  // Get comments
  const { data: comments } = await supabase
    .from("calendar_event_comments")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  // Get relations
  const { data: relations } = await supabase
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
 * Fetch comments for an event (for realtime updates)
 */
export async function getEventComments(
  eventId: string,
): Promise<CalendarEventComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_event_comments")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  return data ?? [];
}
