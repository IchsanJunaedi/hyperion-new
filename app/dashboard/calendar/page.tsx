import { redirect } from "next/navigation";

import { CalendarWithQuickAdd } from "@/features/calendar/components/CalendarWithQuickAdd";
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

  // Determine if user is manager in any org (non-owner access)
  let managerOrgSlug: string | null = null;
  let managerOrgId: string | null = null;
  let managerDivisions: Array<{ id: string; name: string }> = [];

  if (!isOwner) {
    // Check if user is manager in some org
    const { data: managerMembership } = await supabase
      .from("team_members")
      .select("organization_id, role, organizations(id, slug)")
      .eq("user_id", user.id)
      .eq("role", "manager")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!managerMembership) {
      // Not owner, not manager — redirect to dashboard
      redirect("/dashboard");
    }

    // managerMembership.organizations is an object (join)
    const orgJoin = managerMembership.organizations as unknown as {
      id: string;
      slug: string;
    } | null;
    managerOrgId = orgJoin?.id ?? null;
    managerOrgSlug = orgJoin?.slug ?? null;

    if (managerOrgId && managerOrgSlug) {
      const { data: divs } = await supabase
        .from("divisions")
        .select("id, name")
        .eq("organization_id", managerOrgId)
        .eq("is_active", true)
        .order("name");
      managerDivisions = divs ?? [];
    }
  }

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

  // Collect all events
  const allEvents: CalendarEvent[] = [];

  // Which orgs to fetch — owner sees all, manager sees only theirs
  let orgs: Array<{ id: string; slug: string; name: string }> = [];

  if (isOwner) {
    const { data } = await admin
      .from("organizations")
      .select("id, slug, name")
      .order("created_at", { ascending: false });
    orgs = data ?? [];
  } else if (managerOrgId && managerOrgSlug) {
    orgs = [{ id: managerOrgId, slug: managerOrgSlug, name: "" }];
  }

  for (const org of orgs) {
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

    // 2. Scrims not already linked
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
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  // Owner: sees all orgs, readOnly for the unified view
  // Manager: can add events to their own org via QuickAddModal
  const isManager = !isOwner && !!managerOrgSlug;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">
            Calendar
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {isOwner ? "Kalender Terpadu" : "Kalender Tim"}
          </h1>
          {isManager && (
            <p className="mt-0.5 text-xs text-white/40">
              Klik tanggal untuk tambah event ke tim kamu
            </p>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:p-6">
        {isManager && managerOrgSlug ? (
          // Manager: clickable dates with QuickAdd modal
          <CalendarWithQuickAdd
            orgSlug={managerOrgSlug}
            events={allEvents}
            year={year}
            month={month}
            divisions={managerDivisions}
            canCreate
          />
        ) : (
          // Owner: read-only unified view
          <CalendarGrid
            orgSlug="dashboard"
            events={allEvents}
            year={year}
            month={month}
            readOnly
          />
        )}
      </div>

      {isOwner && (
        <p className="text-center text-xs text-white/30">
          Kalender terpadu — semua tim, semua event. Untuk menambah event masuk
          ke workspace tim.
        </p>
      )}
    </div>
  );
}
