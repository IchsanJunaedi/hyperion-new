import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CalendarWithQuickAdd } from "@/features/calendar/components/CalendarWithQuickAdd";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarEvent } from "@/features/calendar/queries";

export const dynamic = "force-dynamic";

interface DashboardCalendarPageProps {
  searchParams: Promise<{ y?: string; m?: string; org?: string }>;
}

export default async function DashboardCalendarPage({
  searchParams,
}: DashboardCalendarPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);
  const admin = createAdminClient();

  type OrgRow = { id: string; slug: string; name: string };
  let allOrgs: OrgRow[] = [];

  if (isOwner) {
    const { data } = await admin
      .from("organizations")
      .select("id, slug, name")
      .order("created_at", { ascending: false });
    allOrgs = (data ?? []) as OrgRow[];
  } else {
    const { data: membership } = await supabase
      .from("team_members")
      .select("organization_id, organizations(id, slug, name)")
      .eq("user_id", user.id)
      .eq("role", "manager")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!membership) redirect("/");

    const orgJoin = membership.organizations as unknown as OrgRow | null;
    if (orgJoin?.id && orgJoin?.slug) {
      allOrgs = [orgJoin];
    }
  }

  const sp = await searchParams;
  const now = new Date();
  const year = sp.y ? parseInt(sp.y, 10) : now.getFullYear();
  const month = sp.m ? parseInt(sp.m, 10) : now.getMonth();

  // Active org: from URL param if valid, else first
  const activeOrg =
    (sp.org ? allOrgs.find((o) => o.slug === sp.org) : null) ??
    allOrgs[0] ??
    null;
  const activeOrgSlug = activeOrg?.slug ?? null;
  const activeOrgId = activeOrg?.id ?? null;
  const canCreate = Boolean(activeOrgSlug);

  // Divisions for quick-add modal
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

  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const from = new Date(Date.UTC(year, month, 1) - WIB_OFFSET_MS).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59) - WIB_OFFSET_MS).toISOString();

  // Load events for active org only
  const allEvents: CalendarEvent[] = [];

  if (activeOrgId) {
    const { data: manualEvents } = await admin
      .from("calendar_events")
      .select("*")
      .eq("organization_id", activeOrgId)
      .gte("starts_at", from)
      .lte("starts_at", to)
      .order("starts_at", { ascending: true });

    if (manualEvents) allEvents.push(...manualEvents);

    const linkedTournamentIds = new Set(
      manualEvents
        ?.filter((e) => e.ref_type === "tournament" && e.ref_id)
        .map((e) => e.ref_id!) ?? [],
    );

    const { data: tournaments } = await admin
      .from("tournaments")
      .select("id, name, start_date, created_by")
      .eq("organization_id", activeOrgId)
      .gte("start_date", from.slice(0, 10))
      .lte("start_date", to.slice(0, 10));

    for (const t of tournaments ?? []) {
      if (linkedTournamentIds.has(t.id)) continue;
      allEvents.push({
        id: `tournament-${t.id}`,
        organization_id: activeOrgId,
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
        visibility: "all",
      } as CalendarEvent);
    }

    const linkedScrimIds = new Set(
      manualEvents
        ?.filter((e) => e.ref_type === "scrim" && e.ref_id)
        .map((e) => e.ref_id!) ?? [],
    );

    const { data: scrims } = await admin
      .from("scrims")
      .select("id, opponent_name, scheduled_at, format, division_id, created_by")
      .eq("organization_id", activeOrgId)
      .in("status", ["scheduled", "ongoing"])
      .gte("scheduled_at", from)
      .lte("scheduled_at", to);

    for (const s of scrims ?? []) {
      if (linkedScrimIds.has(s.id)) continue;
      allEvents.push({
        id: `scrim-${s.id}`,
        organization_id: activeOrgId,
        division_id: s.division_id ?? null,
        created_by: s.created_by,
        title: `Scrim vs ${s.opponent_name}`,
        description: `Format: ${s.format.toUpperCase()}`,
        event_type: "scrim",
        starts_at: s.scheduled_at,
        ends_at: null,
        is_all_day: false,
        location: null,
        ref_id: s.id,
        ref_type: "scrim",
        created_at: s.scheduled_at,
        visibility: "all",
      } as CalendarEvent);
    }
  }

  allEvents.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  // navBasePath preserves ?org= when there are multiple orgs
  const navBasePath =
    allOrgs.length > 1 && activeOrgSlug
      ? `/dashboard/calendar?org=${activeOrgSlug}`
      : "/dashboard/calendar";

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">
            Home
          </Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">Kalender</span>
        </div>
      </header>

      <main className="flex-1 px-8 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Kalender Tim
          </h1>
          {canCreate && activeOrgSlug && (
            <Link
              href={`/${activeOrgSlug}/calendar/new`}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah event
            </Link>
          )}
        </div>

        {/* Org selector — only when owner has multiple orgs */}
        {allOrgs.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {allOrgs.map((org) => {
              const isActive = org.slug === activeOrg?.slug;
              const params = new URLSearchParams();
              params.set("org", org.slug);
              if (sp.y) params.set("y", sp.y);
              if (sp.m) params.set("m", sp.m);
              return (
                <Link
                  key={org.id}
                  href={`/dashboard/calendar?${params.toString()}`}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? "bg-yellow-400 text-black"
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {org.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Event type legend */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] text-white/40">
          <span className="font-semibold uppercase tracking-wider">Legenda:</span>
          {[
            { color: "bg-yellow-400", label: "Turnamen" },
            { color: "bg-blue-400", label: "Scrim" },
            { color: "bg-green-400", label: "Latihan" },
            { color: "bg-purple-400", label: "Meeting" },
            { color: "bg-rose-400", label: "Bootcamp" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${item.color} inline-block`} />
              {item.label}
            </span>
          ))}
        </div>

        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4 sm:p-6">
          <CalendarWithQuickAdd
            orgSlug={activeOrgSlug ?? "dashboard"}
            events={allEvents}
            year={year}
            month={month}
            divisions={activeDivisions}
            canCreate={canCreate}
            navBasePath={navBasePath}
            userRole={isOwner ? "owner" : "manager"}
          />
        </div>
      </main>
    </>
  );
}
