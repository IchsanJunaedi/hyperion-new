import { Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { categorizeTournaments } from "@/features/tournaments/queries";
import { TournamentCard } from "@/features/tournaments/components/TournamentCard";
import { TournamentAddMenu } from "@/features/tournaments/components/TournamentAddMenu";
import type { Database } from "@/types/database";

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];

const TOURNAMENT_COLUMNS =
  "id, organization_id, division_id, name, status, start_date, start_time, end_date, link, organizer, prize_pool, registration_deadline, registration_fee, registration_url, is_registered, bracket_link, bracket_file_path, notes, created_by, created_at, day_reminder_sent_at, h1_reminder_sent_at, h30_reminder_sent_at, show_in_hero, show_on_schedule, tech_meet_date, tech_meet_time, tech_meet_link, location, location_type";

export const dynamic = "force-dynamic";

interface DashboardTournamentsPageProps {
  searchParams: Promise<{ tab?: string; org?: string }>;
}

type TabKey = "ongoing" | "upcoming" | "registered" | "completed" | "all";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "ongoing", label: "Ongoing" },
  { key: "upcoming", label: "Belum Daftar" },
  { key: "registered", label: "Terdaftar" },
  { key: "completed", label: "Selesai" },
  { key: "all", label: "Semua" },
];

export default async function DashboardTournamentsPage({
  searchParams,
}: DashboardTournamentsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);
  if (!isOwner) redirect("/");

  const admin = createAdminClient();

  // Load every org owned by this owner (not just the first one).
  const { data: orgs, error: orgsError } = await admin
    .from("organizations")
    .select("id, slug, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (orgsError) console.error("[dashboard/tournaments] orgs", orgsError);

  const orgList = orgs ?? [];
  const orgById = new Map(orgList.map((o) => [o.id, o]));
  const orgBySlug = new Map(orgList.map((o) => [o.slug, o]));
  const orgIds = orgList.map((o) => o.id);

  // Load tournaments across ALL owned orgs.
  let tournaments: Tournament[] = [];

  if (orgIds.length > 0) {
    const { data, error } = await admin
      .from("tournaments")
      .select(TOURNAMENT_COLUMNS)
      .in("organization_id", orgIds)
      .order("start_date", { ascending: false })
      .limit(200);
    if (error) console.error("[dashboard/tournaments] list", error);
    tournaments = (data as Tournament[]) ?? [];
  }

  const sp = await searchParams;
  const tab: TabKey =
    sp.tab === "upcoming" ||
    sp.tab === "registered" ||
    sp.tab === "completed" ||
    sp.tab === "all"
      ? sp.tab
      : "ongoing";

  // Optional team filter (?org=slug). Empty = all teams.
  const activeOrg = sp.org ? orgBySlug.get(sp.org) : undefined;
  const scoped = activeOrg
    ? tournaments.filter((t) => t.organization_id === activeOrg.id)
    : tournaments;

  const { upcoming, registered, ongoing, completed, cancelled } =
    categorizeTournaments(scoped);

  let filtered = ongoing;
  if (tab === "upcoming") filtered = upcoming;
  else if (tab === "registered") filtered = registered;
  else if (tab === "completed") filtered = [...completed, ...cancelled];
  else if (tab === "all") filtered = scoped;

  const orgParam = activeOrg ? `&org=${activeOrg.slug}` : "";

  return (
    <>
      <main className="space-y-6 px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-ui-text-2" />
            <h1 className="text-xl font-bold text-ui-text">Info Turnamen</h1>
          </div>
          <TournamentAddMenu
            orgs={orgList.map((o) => ({ slug: o.slug, name: o.name }))}
          />
        </div>

        {/* Team filter */}
        {orgList.length > 0 && (
          <nav aria-label="Filter tim" className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/tournaments?tab=${tab}`}
              aria-current={!activeOrg ? "page" : undefined}
              className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
                !activeOrg
                  ? "bg-ui-text-dim text-ui-bg"
                  : "bg-ui-surface text-ui-text-2 hover:bg-ui-hover hover:text-ui-text"
              }`}
            >
              Semua Tim
            </Link>
            {orgList.map((org) => {
              const active = activeOrg?.slug === org.slug;
              return (
                <Link
                  key={org.id}
                  href={`/dashboard/tournaments?tab=${tab}&org=${org.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
                    active
                      ? "bg-ui-text-dim text-ui-bg"
                      : "bg-ui-surface text-ui-text-2 hover:bg-ui-hover hover:text-ui-text"
                  }`}
                >
                  {org.name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Status filter */}
        <nav aria-label="Filter turnamen" className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            const count = t.key === "upcoming" ? upcoming.length : 0;
            return (
              <Link
                key={t.key}
                href={`/dashboard/tournaments?tab=${t.key}${orgParam}`}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
                  active
                    ? "bg-ui-text-dim text-ui-bg"
                    : "bg-ui-surface text-ui-text-2 hover:bg-ui-hover hover:text-ui-text"
                }`}
              >
                {t.label}
                {count > 0 && !active && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-black">
                    {count}
                  </span>
                )}
                {count > 0 && active && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ui-hover px-1 text-[10px] font-bold text-ui-text-2">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ui-border bg-ui-surface p-10 text-center">
            <Trophy className="mx-auto h-8 w-8 text-ui-text-muted" />
            <p className="mt-3 text-sm text-ui-text-2">
              {orgList.length === 0
                ? "Belum ada tim yang kamu miliki."
                : tab === "ongoing"
                  ? "Tidak ada turnamen yang sedang berlangsung."
                  : tab === "upcoming"
                    ? "Tidak ada turnamen yang belum didaftarkan."
                    : tab === "registered"
                      ? "Belum ada turnamen terdaftar."
                      : tab === "completed"
                        ? "Belum ada turnamen selesai."
                        : "Belum ada turnamen."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => {
              const org = orgById.get(t.organization_id);
              return (
                <li key={t.id}>
                  <TournamentCard
                    tournament={t}
                    orgSlug={org?.slug ?? ""}
                    orgName={org?.name ?? null}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
