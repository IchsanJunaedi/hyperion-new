import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CalendarWithQuickAdd } from "@/features/calendar/components/CalendarWithQuickAdd";
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
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);
  const admin = createAdminClient();

  // Load orgs (single query, used for both event loading AND active org)
  type OrgRow = { id: string; slug: string };
  let orgsToLoad: OrgRow[] = [];

  if (isOwner) {
    const { data } = await admin
      .from("organizations")
      .select("id, slug")
      .order("created_at", { ascending: false });
    orgsToLoad = (data ?? []) as OrgRow[];
  } else {
    const { data: membership } = await supabase
      .from("team_members")
      .select("organization_id, organizations(id, slug)")
      .eq("user_id", user.id)
      .eq("role", "manager")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!membership) redirect("/dashboard");

    const orgJoin = membership.organizations as unknown as OrgRow | null;
    if (orgJoin?.id && orgJoin?.slug) {
      orgsToLoad = [orgJoin];
    }
  }

  // Active org = first org found (owner picks first; manager has exactly one)
  const activeOrg = orgsToLoad[0] ?? null;
  const activeOrgSlug = activeOrg?.slug ?? null;
  const activeOrgId = activeOrg?.id ?? null;
  const canCreate = Boolean(activeOrgSlug);

  // Load divisions for quick-add modal
  let activeDivisions: Array<{ id: string; name: string }> = [];
  if (activeOrgId) {
    const { data: divs } = await admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", activeOrgId)
      .eq("is_active", true)
      .order("name");
    activeDivisions = divs ?? [];
  }

  // Month range
  const sp = await searchParams;
  const now = new Date();
  const year = sp.y ? parseInt(sp.y, 10) : now.getFullYear();
  const month = sp.m ? parseInt(sp.m, 10) : now.getMonth();

  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const from = new Date(Date.UTC(year, month, 1) - WIB_OFFSET_MS).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59) - WIB_OFFSET_MS).toISOString();

  // Load all events
  const allEvents: CalendarEvent[] = [];

  for (const org of orgsToLoad) {
    const { data: manualEvents } = await admin
      .from("calendar_events")
      .select("*")
      .eq("organization_id", org.id)
      .gte("starts_at", from)
      .lte("starts_at", to)
      .order("starts_at", { ascending: true });

    if (manualEvents) allEvents.push(...manualEvents);

    const linkedScrimIds = new Set(
      manualEvents?.filter((e) => e.ref_type === "scrim" && e.ref_id).map((e) => e.ref_id!) ?? [],
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

    const linkedTournamentIds = new Set(
      manualEvents?.filter((e) => e.ref_type === "tournament" && e.ref_id).map((e) => e.ref_id!) ?? [],
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

  allEvents.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">Home</Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">Kalender</span>
        </div>
      </header>

      <main className="flex-1 px-8 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#E5E2E1]">
              {isOwner ? "Kalender Terpadu" : "Kalender Tim"}
            </h1>
            <p className="mt-0.5 text-sm text-[#9B9A97]">
              {canCreate ? "Klik tanggal untuk tambah event" : "Belum ada tim yang terdaftar"}
            </p>
          </div>
          {canCreate && activeOrgSlug && (
            <Link
              href={`/${activeOrgSlug}/calendar/new`}
              className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium bg-[#2C2C2C] text-[#D4D4D4] border border-[#2D2D2D] transition hover:bg-[#353434] hover:text-[#E5E2E1] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah event
            </Link>
          )}
        </div>

        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4 sm:p-6">
          <CalendarWithQuickAdd
            orgSlug={activeOrgSlug ?? "dashboard"}
            events={allEvents}
            year={year}
            month={month}
            divisions={activeDivisions}
            canCreate={canCreate}
            navBasePath="/dashboard/calendar"
          />
        </div>
      </main>
    </>
  );
}
