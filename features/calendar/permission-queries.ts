"use server";

import { createClient } from "@/lib/supabase/server";
import { getAccessibleCalendars, getAccessibleEvents } from "@/lib/permissions/calendar-access";

import type {
  CalendarConfig,
  CalendarAuditLog,
} from "@/lib/permissions/calendar-types";
import type { Database } from "@/types/database";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

// ============================================================================
// Type Definitions
// ============================================================================

export interface ActionResult<T = void> {
  ok: boolean;
  message?: string;
  data?: T;
}

export interface CalendarWithEventCount extends CalendarConfig {
  eventCount: number;
}

export interface EventWithPermissionContext extends CalendarEvent {
  calendar?: CalendarConfig | null;
  userCanEdit: boolean;
  userCanDelete: boolean;
}

export interface AuditLogsResult {
  logs: CalendarAuditLog[];
  total: number;
}

// ============================================================================
// Get Accessible Calendars
// ============================================================================

/**
 * Get all calendars accessible by the current user.
 * Filters based on user's role and calendar visibility.
 *
 * @param orgSlug - Organization slug
 * @returns Action result with accessible calendars
 */
export async function getAccessibleCalendarsAction(
  orgSlug: string,
): Promise<ActionResult<{ calendars: CalendarWithEventCount[] }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login terlebih dahulu" };
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  try {
    const calendars = await getAccessibleCalendars(user.id, org.id);

    // Get event counts for all calendars in a single query
    const calendarIds = calendars.map((c) => c.id);
    const countMap: Record<string, number> = {};
    if (calendarIds.length > 0) {
      const { data: eventRows } = await supabase
        .from("calendar_events")
        .select("calendar_id")
        .in("calendar_id", calendarIds)
        .is("deleted_at", null)
        .limit(2000);
      for (const row of eventRows ?? []) {
        if (!row.calendar_id) continue;
        countMap[row.calendar_id] = (countMap[row.calendar_id] ?? 0) + 1;
      }
    }
    const calendarsWithCounts = calendars.map((cal) => ({
      ...cal,
      eventCount: countMap[cal.id] ?? 0,
    }));

    return {
      ok: true,
      data: { calendars: calendarsWithCounts },
    };
  } catch (error) {
    console.error("Error fetching accessible calendars:", error);
    return {
      ok: false,
      message: "Gagal mengambil kalender yang dapat diakses",
    };
  }
}

// ============================================================================
// Get Calendar Detail with Permission Context
// ============================================================================

/**
 * Get calendar detail with user's permission context.
 *
 * @param orgSlug - Organization slug
 * @param calendarId - Calendar ID
 * @returns Action result with calendar and permissions
 */
export async function getCalendarDetailAction(
  orgSlug: string,
  calendarId: string,
): Promise<ActionResult<{ calendar: CalendarConfig }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login terlebih dahulu" };
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  // Get calendar
  const { data: calendar } = await supabase
    .from("calendar_configs")
    .select("*")
    .eq("id", calendarId)
    .eq("organization_id", org.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!calendar) {
    return { ok: false, message: "Kalender tidak ditemukan" };
  }

  // Check if user can access this calendar
  const calendars = await getAccessibleCalendars(user.id, org.id);
  const accessible = calendars.find((c) => c.id === calendarId);

  if (!accessible) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses ke kalender ini",
    };
  }

  return {
    ok: true,
    data: { calendar: calendar as unknown as CalendarConfig },
  };
}

// ============================================================================
// List Calendar Events with Permission Filtering
// ============================================================================

/**
 * List events from a specific calendar that user can see.
 * Applies both calendar and event-level visibility checks.
 *
 * @param orgSlug - Organization slug
 * @param calendarId - Calendar ID
 * @param dateRange - Date range for filtering (ISO format)
 * @returns Action result with filtered events
 */
export async function listCalendarEventsWithPermissionsAction(
  orgSlug: string,
  calendarId: string,
  dateRange: { from: string; to: string },
): Promise<ActionResult<{ events: EventWithPermissionContext[] }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login terlebih dahulu" };
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  // Get calendar
  const { data: calendar } = await supabase
    .from("calendar_configs")
    .select("*")
    .eq("id", calendarId)
    .eq("organization_id", org.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!calendar) {
    return { ok: false, message: "Kalender tidak ditemukan" };
  }

  // Check if user can access calendar
  const calendars = await getAccessibleCalendars(user.id, org.id);
  const accessible = calendars.find((c) => c.id === calendarId);

  if (!accessible) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses ke kalender ini",
    };
  }

  try {
    // Get events from calendar within date range
    const { data: events, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("organization_id", org.id)
      .eq("calendar_id", calendarId)
      .gte("starts_at", new Date(dateRange.from).toISOString())
      .lte("starts_at", new Date(dateRange.to).toISOString())
      .is("deleted_at", null)
      .order("starts_at", { ascending: true });

    if (error) {
      return { ok: false, message: error.message };
    }

    // Add permission context to each event
    const eventsWithContext: EventWithPermissionContext[] = (events ?? []).map(
      (event) => ({
        ...(event as unknown as CalendarEvent),
        calendar: calendar as unknown as CalendarConfig,
        userCanEdit: user.id === event.created_by,
        userCanDelete: user.id === event.created_by,
      }),
    );

    return {
      ok: true,
      data: { events: eventsWithContext },
    };
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return {
      ok: false,
      message: "Gagal mengambil event kalender",
    };
  }
}

// ============================================================================
// Get User's Accessible Events Across All Calendars
// ============================================================================

/**
 * Get all events accessible to user across all calendars.
 * Respects visibility rules and date range.
 *
 * @param orgSlug - Organization slug
 * @param dateRange - Date range for filtering (ISO format)
 * @returns Action result with filtered events
 */
export async function getUserAccessibleEventsAction(
  orgSlug: string,
  dateRange: { from: string; to: string },
): Promise<ActionResult<{ events: EventWithPermissionContext[] }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login terlebih dahulu" };
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  try {
    // Get all accessible calendars
    const calendars = await getAccessibleCalendars(user.id, org.id);
    const calendarIds = calendars.map((c) => c.id);

    if (calendarIds.length === 0) {
      return {
        ok: true,
        data: { events: [] },
      };
    }

    // Get events from accessible calendars
    const { data: events, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("organization_id", org.id)
      .in("calendar_id", calendarIds)
      .gte("starts_at", new Date(dateRange.from).toISOString())
      .lte("starts_at", new Date(dateRange.to).toISOString())
      .is("deleted_at", null)
      .order("starts_at", { ascending: true });

    if (error) {
      return { ok: false, message: error.message };
    }

    // Map events with calendar info and permission context
    const calendarMap = new Map(calendars.map((c) => [c.id, c]));
    const eventsWithContext: EventWithPermissionContext[] = (events ?? []).map(
      (event) => ({
        ...(event as unknown as CalendarEvent),
        calendar: (event.calendar_id ? calendarMap.get(event.calendar_id) ?? null : null) as unknown as CalendarConfig | null,
        userCanEdit: user.id === event.created_by,
        userCanDelete: user.id === event.created_by,
      }),
    );

    return {
      ok: true,
      data: { events: eventsWithContext },
    };
  } catch (error) {
    console.error("Error fetching user accessible events:", error);
    return {
      ok: false,
      message: "Gagal mengambil event yang dapat diakses",
    };
  }
}

// ============================================================================
// Get Calendar Audit Logs
// ============================================================================

/**
 * Get audit logs for calendar operations.
 * Manager+ only.
 *
 * @param orgSlug - Organization slug
 * @param calendarId - Optional calendar ID to filter
 * @param limit - Number of records to return (default 50, max 1000)
 * @param offset - Pagination offset (default 0)
 * @returns Action result with audit logs
 */
export async function getCalendarAuditLogsAction(
  orgSlug: string,
  calendarId?: string,
  limit = 50,
  offset = 0,
): Promise<ActionResult<AuditLogsResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login terlebih dahulu" };
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  // Check permission: only manager+ can view audit logs
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .maybeSingle();

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = user.email === ownerEmail;
  const isManager = member?.role && ["owner", "manager"].includes(member.role);

  if (!isOwner && !isManager) {
    return {
      ok: false,
      message: "Anda tidak memiliki akses untuk melihat audit logs",
    };
  }

  try {
    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 1000);
    const validOffset = Math.max(0, offset);

    // Build query
    let query = supabase
      .from("calendar_audit_logs")
      .select("id, action, actor_id, calendar_id, changes, created_at, entity_type, event_id, metadata, organization_id", { count: "exact" })
      .eq("organization_id", org.id);

    if (calendarId) {
      query = query.eq("calendar_id", calendarId);
    }

    const { data: logs, count, error } = await query
      .order("created_at", { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      data: {
        logs: (logs ?? []) as CalendarAuditLog[],
        total: count ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return {
      ok: false,
      message: "Gagal mengambil audit logs",
    };
  }
}
