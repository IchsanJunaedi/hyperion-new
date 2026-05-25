import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "./queries";

type UserRole = "owner" | "manager" | "coach" | "captain" | "member";

/**
 * Unified calendar: merges manual calendar_events with auto-generated
 * entries from scrims and tournaments for the given month range.
 *
 * @param role - Optional pre-fetched role for the current user in this org.
 *   When provided, skips the internal team_members query (eliminates duplicate
 *   DB round-trip for callers that already resolved the role, e.g. the
 *   workspace calendar page).
 */
export async function listUnifiedCalendarEvents(
  orgId: string,
  from: string,
  to: string,
  role?: UserRole | null,
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: UserRole | null = null;

  if (role !== undefined) {
    // Caller supplied the role — use it directly, skip DB round-trip
    userRole = role;
  } else if (user) {
    // No role supplied — resolve it ourselves
    const ownerEmail = process.env.OWNER_EMAIL;
    if (ownerEmail && user.email === ownerEmail) {
      userRole = "owner";
    } else {
      const { data: member } = await supabase
        .from("team_members")
        .select("role")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (member) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userRole = member.role as any;
      }
    }
  }

  // 1. Manual calendar events — only fetch columns needed by the calendar UI
  // (id, title, event_type, starts_at for display/routing; visibility,
  //  created_by for server-side filtering; ref_id, ref_type for deduplication
  //  and deep-link routing; organization_id, division_id, ends_at, is_all_day,
  //  location, description, created_at for synthetic event construction)
  let query = supabase
    .from("calendar_events")
    .select(
      "id, title, event_type, starts_at, ends_at, is_all_day, visibility, created_by, organization_id, division_id, location, description, ref_id, ref_type, created_at",
    )
    .eq("organization_id", orgId)
    .gte("starts_at", from)
    .lte("starts_at", to);

  if (userRole === "owner") {
    // Owner sees everything
  } else if (userRole === "manager") {
    // Manager sees 'all', 'management', 'coach_up', and anything they created
    if (user) {
      query = query.or(`visibility.in.(all,management,coach_up),created_by.eq.${user.id}`);
    } else {
      query = query.eq("visibility", "all");
    }
  } else if (userRole === "coach") {
    // Coach sees 'all', 'coach_up', and anything they created
    if (user) {
      query = query.or(`visibility.in.(all,coach_up),created_by.eq.${user.id}`);
    } else {
      query = query.eq("visibility", "all");
    }
  } else {
    // Captain, Member, and Guest see 'all' and their own created events
    if (user) {
      query = query.or(`visibility.eq.all,created_by.eq.${user.id}`);
    } else {
      query = query.eq("visibility", "all");
    }
  }

  const { data: manualEvents } = await query.order("starts_at", { ascending: true });

  // Cast is safe: we select all fields used by the calendar UI and synthetic
  // event construction; unused v2 fields (tags, color, etc.) are not accessed
  // by CalendarGrid or any other consumer of this function's return value.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: CalendarEvent[] = (manualEvents ?? []) as any[];

  // 2. Tournaments not already linked
  const linkedTournamentIds = new Set(
    events.filter((e) => e.ref_type === "tournament" && e.ref_id).map((e) => e.ref_id!),
  );

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, start_date, created_by")
    .eq("organization_id", orgId)
    .gte("start_date", from.slice(0, 10))
    .lte("start_date", to.slice(0, 10));

  for (const t of tournaments ?? []) {
    if (linkedTournamentIds.has(t.id)) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    events.push({
      id: `tournament-${t.id}`,
      organization_id: orgId,
      division_id: null,
      created_by: t.created_by ?? "",
      title: `Turnamen: ${t.name}`,
      description: null,
      event_type: "tournament",
      starts_at: new Date(t.start_date).toISOString(),
      ends_at: null,
      is_all_day: true,
      location: null,
      calendar_id: null,
      ref_id: t.id,
      ref_type: "tournament",
      created_at: new Date(t.start_date).toISOString(),
      visibility: "all",
    } as CalendarEvent);
  }

  // 3. Scrims not already linked
  const linkedScrimIds = new Set(
    events.filter((e) => e.ref_type === "scrim" && e.ref_id).map((e) => e.ref_id!),
  );

  const { data: scrims } = await supabase
    .from("scrims")
    .select("id, opponent_name, scheduled_at, format, division_id, created_by")
    .eq("organization_id", orgId)
    .in("status", ["scheduled", "ongoing"])
    .gte("scheduled_at", from)
    .lte("scheduled_at", to);

  for (const s of scrims ?? []) {
    if (linkedScrimIds.has(s.id)) continue;
    events.push({
      id: `scrim-${s.id}`,
      organization_id: orgId,
      division_id: s.division_id ?? null,
      created_by: s.created_by,
      title: `Scrim vs ${s.opponent_name}`,
      description: `Format: ${s.format.toUpperCase()}`,
      event_type: "scrim",
      starts_at: s.scheduled_at,
      ends_at: null,
      is_all_day: false,
      location: null,
      calendar_id: null,
      ref_id: s.id,
      ref_type: "scrim",
      created_at: s.scheduled_at,
      visibility: "all",
    } as CalendarEvent);
  }

  // Sort by starts_at
  events.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return events;
}
