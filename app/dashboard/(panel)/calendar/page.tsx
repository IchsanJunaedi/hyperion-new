import { Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { CalendarWithQuickAdd } from "@/features/calendar/components/CalendarWithQuickAdd";
import { CalendarGrid } from "@/features/calendar/components/CalendarGrid";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarEvent } from "@/features/calendar/queries";

export const dynamic = "force-dynamic";

const ORG_COLORS = [
  "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  "bg-green-500/20 text-green-300 border border-green-500/30",
  "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  "bg-pink-500/20 text-pink-300 border border-pink-500/30",
];

interface DashboardCalendarPageProps {
  searchParams: Promise<{ y?: string; m?: string; org?: string }>;
}

const DashboardCalendarPage = async ({
  searchParams,
}: DashboardCalendarPageProps) => {
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
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    allOrgs = (data ?? []) as OrgRow[];
  } else {
    const { data: memberships } = await supabase
      .from("team_members")
      .select("organization_id, organizations(id, slug, name)")
      .eq("user_id", user.id)
      .eq("role", "manager")
      .eq("is_active", true)
      .limit(20);

    for (const m of memberships ?? []) {
      const org = m.organizations as unknown as OrgRow | null;
      if (org?.id && org?.slug) allOrgs.push(org);
    }

    if (allOrgs.length === 0) redirect("/");
  }

  const sp = await searchParams;
  const now = new Date();
  const year = sp.y ? parseInt(sp.y, 10) : now.getFullYear();
  const month = sp.m ? parseInt(sp.m, 10) : now.getMonth();

  // "Semua Tim" mode: no ?org= or ?org=all
  const isAllOrgs = !sp.org || sp.org === "all";

  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const from = new Date(Date.UTC(year, month, 1) - WIB_OFFSET_MS).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59) - WIB_OFFSET_MS).toISOString();

  type AgendaEvent = {
    id: string;
    title: string;
    starts_at: string;
    event_type: string;
    organization_id: string;
    detailPath: string;
  };

  const allOrgEvents: CalendarEvent[] = [];
  const agendaEvents: AgendaEvent[] = [];

  // ── "Semua Tim" mode ────────────────────────────────────────────────────────
  if (isAllOrgs && allOrgs.length > 0) {
    const orgIds = allOrgs.map((o) => o.id);
    const orgSlugById = new Map(allOrgs.map((o) => [o.id, o.slug]));

    const [eventsRes, tournamentsRes, scrimsRes] = await Promise.all([
      admin.from("calendar_events").select("*")
        .in("organization_id", orgIds)
        .gte("starts_at", from).lte("starts_at", to)
        .order("starts_at", { ascending: true }).limit(200),
      admin.from("tournaments").select("id, name, start_date, created_by, organization_id")
        .in("organization_id", orgIds)
        .gte("start_date", from.slice(0, 10)).lte("start_date", to.slice(0, 10)).limit(100),
      admin.from("scrims").select("id, opponent_name, scheduled_at, format, division_id, created_by, organization_id")
        .in("organization_id", orgIds)
        .in("status", ["scheduled", "ongoing"])
        .gte("scheduled_at", from).lte("scheduled_at", to).limit(100),
    ]);

    const linkedTIds = new Set((eventsRes.data ?? []).filter((e) => e.ref_type === "tournament" && e.ref_id).map((e) => e.ref_id!));
    const linkedSIds = new Set((eventsRes.data ?? []).filter((e) => e.ref_type === "scrim" && e.ref_id).map((e) => e.ref_id!));

    for (const e of eventsRes.data ?? []) {
      allOrgEvents.push(e);
      const slug = orgSlugById.get(e.organization_id) ?? "";
      agendaEvents.push({ id: e.id, title: e.title, starts_at: e.starts_at, event_type: e.event_type, organization_id: e.organization_id, detailPath: `/${slug}/calendar/${e.id}` });
    }
    for (const t of tournamentsRes.data ?? []) {
      if (linkedTIds.has(t.id)) continue;
      const slug = orgSlugById.get(t.organization_id) ?? "";
      const calEv = { id: `tournament-${t.id}`, organization_id: t.organization_id, division_id: null, created_by: t.created_by ?? "", title: `Turnamen: ${t.name}`, description: null, event_type: "tournament", starts_at: new Date(t.start_date).toISOString(), ends_at: null, is_all_day: true, location: null, ref_id: t.id, ref_type: "tournament", created_at: new Date(t.start_date).toISOString(), visibility: "all" } as CalendarEvent;
      allOrgEvents.push(calEv);
      agendaEvents.push({ id: calEv.id, title: calEv.title, starts_at: calEv.starts_at, event_type: "tournament", organization_id: t.organization_id, detailPath: `/${slug}/tournaments/${t.id}` });
    }
    for (const s of scrimsRes.data ?? []) {
      if (linkedSIds.has(s.id)) continue;
      const slug = orgSlugById.get(s.organization_id) ?? "";
      const calEv = { id: `scrim-${s.id}`, organization_id: s.organization_id, division_id: s.division_id ?? null, created_by: s.created_by, title: `Scrim vs ${s.opponent_name}`, description: `Format: ${s.format.toUpperCase()}`, event_type: "scrim", starts_at: s.scheduled_at, ends_at: null, is_all_day: false, location: null, ref_id: s.id, ref_type: "scrim", created_at: s.scheduled_at, visibility: "all" } as CalendarEvent;
      allOrgEvents.push(calEv);
      agendaEvents.push({ id: calEv.id, title: calEv.title, starts_at: s.scheduled_at, event_type: "scrim", organization_id: s.organization_id, detailPath: `/${slug}/scrim/${s.id}` });
    }

    allOrgEvents.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    agendaEvents.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }

  // ── Single org mode ─────────────────────────────────────────────────────────
  const activeOrg = sp.org && sp.org !== "all" ? allOrgs.find((o) => o.slug === sp.org) ?? null : null;
  const activeOrgSlug = activeOrg?.slug ?? null;
  const activeOrgId = activeOrg?.id ?? null;

  let activeDivisions: Array<{ id: string; name: string }> = [];
  const singleOrgEvents: CalendarEvent[] = [];

  if (!isAllOrgs && activeOrgId && activeOrgSlug) {
    const { data: divs } = await admin.from("divisions").select("id, name")
      .eq("organization_id", activeOrgId).eq("is_active", true).order("name");
    activeDivisions = divs ?? [];

    const { data: manualEvents } = await admin.from("calendar_events").select("*")
      .eq("organization_id", activeOrgId)
      .gte("starts_at", from).lte("starts_at", to)
      .order("starts_at", { ascending: true });
    if (manualEvents) singleOrgEvents.push(...manualEvents);

    const linkedTIds = new Set(manualEvents?.filter((e) => e.ref_type === "tournament" && e.ref_id).map((e) => e.ref_id!) ?? []);
    const linkedSIds = new Set(manualEvents?.filter((e) => e.ref_type === "scrim" && e.ref_id).map((e) => e.ref_id!) ?? []);

    const { data: tournaments } = await admin.from("tournaments").select("id, name, start_date, created_by")
      .eq("organization_id", activeOrgId)
      .gte("start_date", from.slice(0, 10)).lte("start_date", to.slice(0, 10));
    for (const t of tournaments ?? []) {
      if (linkedTIds.has(t.id)) continue;
      singleOrgEvents.push({ id: `tournament-${t.id}`, organization_id: activeOrgId, division_id: null, created_by: t.created_by ?? "", title: `Turnamen: ${t.name}`, description: null, event_type: "tournament", starts_at: new Date(t.start_date).toISOString(), ends_at: null, is_all_day: true, location: null, ref_id: t.id, ref_type: "tournament", created_at: new Date(t.start_date).toISOString(), visibility: "all" } as CalendarEvent);
    }

    const { data: scrims } = await admin.from("scrims").select("id, opponent_name, scheduled_at, format, division_id, created_by")
      .eq("organization_id", activeOrgId).in("status", ["scheduled", "ongoing"])
      .gte("scheduled_at", from).lte("scheduled_at", to);
    for (const s of scrims ?? []) {
      if (linkedSIds.has(s.id)) continue;
      singleOrgEvents.push({ id: `scrim-${s.id}`, organization_id: activeOrgId, division_id: s.division_id ?? null, created_by: s.created_by, title: `Scrim vs ${s.opponent_name}`, description: `Format: ${s.format.toUpperCase()}`, event_type: "scrim", starts_at: s.scheduled_at, ends_at: null, is_all_day: false, location: null, ref_id: s.id, ref_type: "scrim", created_at: s.scheduled_at, visibility: "all" } as CalendarEvent);
    }

    singleOrgEvents.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }

  const buildTabHref = (orgSlug: string | null) => {
    const params = new URLSearchParams();
    if (orgSlug) params.set("org", orgSlug);
    if (sp.y) params.set("y", sp.y);
    if (sp.m) params.set("m", sp.m);
    const qs = params.toString();
    return `/dashboard/calendar${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <main className="flex-1 px-4 sm:px-8 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-ui-text-2" />
            <h1 className="text-2xl font-bold text-ui-text sm:text-3xl">
              Kalender Tim
            </h1>
          </div>
          {!isAllOrgs && activeOrgSlug && (
            <Link
              href={`/${activeOrgSlug}/calendar/new`}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah event
            </Link>
          )}
        </div>

        {/* Org tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href={buildTabHref(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              isAllOrgs
                ? "bg-yellow-400 text-black"
                : "bg-ui-elevated text-ui-text-2 hover:bg-ui-hover hover:text-ui-text"
            }`}
          >
            Semua Tim
          </Link>
          {allOrgs.map((org) => {
            const isActive = !isAllOrgs && org.slug === activeOrg?.slug;
            return (
              <Link
                key={org.id}
                href={buildTabHref(org.slug)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? "bg-yellow-400 text-black"
                    : "bg-ui-elevated text-ui-text-2 hover:bg-ui-hover hover:text-ui-text"
                }`}
              >
                {org.name}
              </Link>
            );
          })}
        </div>

        {/* ── "Semua Tim" view ─────────────────────────────────────────────── */}
        {isAllOrgs && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-ui-text-muted">
              <span className="font-semibold uppercase tracking-wider">Tim:</span>
              {allOrgs.map((org, i) => {
                const color = ORG_COLORS[i % ORG_COLORS.length]!;
                return (
                  <span key={org.id} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
                    {org.name}
                  </span>
                );
              })}
            </div>

            <div className="rounded-xl border border-ui-border bg-ui-surface p-4 sm:p-6">
              <CalendarGrid
                orgSlug="dashboard"
                events={allOrgEvents}
                year={year}
                month={month}
                readOnly={true}
                canCreate={false}
                navBasePath="/dashboard/calendar"
                eventHrefs={Object.fromEntries(agendaEvents.map((e) => [e.id, e.detailPath]))}
              />
            </div>

            <div className="mt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ui-text-2">
                Agenda bulan ini
              </h2>
              {agendaEvents.length === 0 ? (
                <div className="rounded-lg border border-ui-border bg-ui-surface py-10 text-center text-sm text-ui-text-muted">
                  Tidak ada event di bulan ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {agendaEvents.map((ev) => {
                    const orgIdx = allOrgs.findIndex((o) => o.id === ev.organization_id);
                    const color = ORG_COLORS[Math.max(orgIdx, 0) % ORG_COLORS.length]!;
                    const orgName = allOrgs[orgIdx]?.name ?? "";
                    return (
                      <div key={ev.id} className="flex items-center gap-4 rounded-lg border border-ui-border bg-ui-surface px-4 py-3">
                        <div className="w-12 shrink-0 text-center">
                          <p className="text-lg font-bold text-ui-text-dim">
                            {format(new Date(ev.starts_at), "d")}
                          </p>
                          <p className="text-[10px] uppercase text-ui-text-muted">
                            {format(new Date(ev.starts_at), "EEE", { locale: localeId })}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-ui-text">{ev.title}</p>
                          <p className="text-xs text-ui-text-2">
                            {format(new Date(ev.starts_at), "HH:mm")}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
                          {orgName}
                        </span>
                        <Link href={ev.detailPath} className="shrink-0 text-xs text-ui-text-2 hover:text-ui-text-dim transition">
                          Detail →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Single org view ──────────────────────────────────────────────── */}
        {!isAllOrgs && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] text-ui-text-muted">
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

            <div className="rounded-xl border border-ui-border bg-ui-surface p-4 sm:p-6">
              {activeOrgSlug ? (
                <CalendarWithQuickAdd
                  orgSlug={activeOrgSlug}
                  events={singleOrgEvents}
                  year={year}
                  month={month}
                  divisions={activeDivisions}
                  canCreate={true}
                  navBasePath={`/dashboard/calendar?org=${activeOrgSlug}`}
                  userRole={isOwner ? "owner" : "manager"}
                />
              ) : (
                <p className="py-10 text-center text-sm text-ui-text-muted">
                  Pilih tim dari tab di atas.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
};
export default DashboardCalendarPage;
