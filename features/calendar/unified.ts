import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "./queries";

/**
 * Unified calendar: merges manual calendar_events with auto-generated
 * entries from scrims and tournaments for the given month range.
 */
export async function listUnifiedCalendarEvents(
  orgId: string,
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  // 1. Manual calendar events
  const { data: manualEvents } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("organization_id", orgId)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true });

  const events: CalendarEvent[] = manualEvents ?? [];

  // 2. Scrims not already linked in calendar
  const linkedScrimIds = new Set(
    events.filter((e) => e.ref_type === "scrim" && e.ref_id).map((e) => e.ref_id!),
  );

  const { data: scrims } = await supabase
    .from("scrims")
    .select("id, opponent_name, scheduled_at, format, created_by")
    .eq("organization_id", orgId)
    .gte("scheduled_at", from)
    .lte("scheduled_at", to)
    .in("status", ["scheduled", "ongoing", "completed"]);

  for (const s of scrims ?? []) {
    if (linkedScrimIds.has(s.id)) continue;
    events.push({
      id: `scrim-${s.id}`,
      organization_id: orgId,
      division_id: null,
      created_by: s.created_by,
      title: `Scrim vs ${s.opponent_name}`,
      description: s.format.toUpperCase(),
      event_type: "scrim",
      starts_at: s.scheduled_at,
      ends_at: null,
      is_all_day: false,
      location: null,
      ref_id: s.id,
      ref_type: "scrim",
      created_at: s.scheduled_at,
    });
  }

  // 3. Tournaments not already linked
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
      ref_id: t.id,
      ref_type: "tournament",
      created_at: new Date(t.start_date).toISOString(),
    });
  }

  // Sort by starts_at
  events.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return events;
}
