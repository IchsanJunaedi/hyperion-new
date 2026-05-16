import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CalendarGrid } from "@/features/calendar/components/CalendarGrid";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarEvent } from "@/features/calendar/queries";

export const dynamic = "force-dynamic";

interface DashboardCalendarPageProps {
  searchParams: Promise<{ y?: string; m?: string }>;
}

export default async function DashboardCalendarPage({
  searchParams,
}: DashboardCalendarPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/calendar");

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = ownerEmail && user.email === ownerEmail;

  if (!isOwner) redirect("/dashboard");

  const sp = await searchParams;
  const now = new Date();
  const year = sp.y ? parseInt(sp.y, 10) : now.getFullYear();
  const month = sp.m ? parseInt(sp.m, 10) : now.getMonth(); // 0-indexed

  // Compute WIB-aware month boundaries
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const startUtcMs = Date.UTC(year, month, 1) - WIB_OFFSET_MS;
  const endUtcMs = Date.UTC(year, month + 1, 0, 23, 59, 59) - WIB_OFFSET_MS;
  const from = new Date(startUtcMs).toISOString();
  const to = new Date(endUtcMs).toISOString();

  const admin = createAdminClient();

  // Get all organizations
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, slug, name")
    .order("created_at", { ascending: false });

  // Collect all unified events from all orgs
  const allEvents: CalendarEvent[] = [];

  for (const org of orgs ?? []) {
    // 1. Manual calendar events
    const { data: manualEvents } = await admin
      .from("calendar_events")
      .select("*")
      .eq("organization_id", org.id)
      .gte("starts_at", from)
      .lte("starts_at", to)
      .order("starts_at", { ascending: true });

    if (manualEvents) {
      allEvents.push(...manualEvents);
    }

    // 2. Scrims not already linked in calendar
    const linkedScrimIds = new Set(
      manualEvents
        ?.filter((e) => e.ref_type === "scrim" && e.ref_id)
        .map((e) => e.ref_id!) ?? [],
    );

    const { data: scrims } = await admin
      .from("scrims")
      .select("id, opponent_name, scheduled_at, format, created_by")
      .eq("organization_id", org.id)
      .gte("scheduled_at", from)
      .lte("scheduled_at", to)
      .in("status", ["scheduled", "ongoing", "completed"]);

    for (const s of scrims ?? []) {
      if (linkedScrimIds.has(s.id)) continue;
      allEvents.push({
        id: `scrim-${s.id}`,
        organization_id: org.id,
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
      } as CalendarEvent);
    }

    // 3. Tournaments not already linked
    const linkedTournamentIds = new Set(
      manualEvents
        ?.filter((e) => e.ref_type === "tournament" && e.ref_id)
        .map((e) => e.ref_id!) ?? [],
    );

    const { data: tournaments } = await admin
      .from("tournaments")
      .select("id, name, start_date, created_by")
      .eq("organization_id", org.id)
      .gte("start_date", from.slice(0, 10))
      .lte("start_date", to.slice(0, 10));

    for (const t of tournaments ?? []) {
      if (linkedTournamentIds.has(t.id)) continue;
      allEvents.push({
        id: `tournament-${t.id}`,
        organization_id: org.id,
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
      } as CalendarEvent);
    }
  }

  // Sort by starts_at
  allEvents.sort(
    (a, b) =>
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  // For dashboard, we can't add events directly, so we'll note this in the UI
  // The add button will redirect to manage panel or team workspace

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">
            Calendar
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Kalender Terpadu
          </h1>
        </div>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:p-6">
        <CalendarGrid
          orgSlug="dashboard"
          events={allEvents}
          year={year}
          month={month}
          readOnly
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-4 text-sm text-white/70">
        <p>
          Kalender terpadu menampilkan event dari semua tim. Untuk menambah
          event, buka panel Manager atau workspace tim.
        </p>
      </div>
    </div>
  );
}
