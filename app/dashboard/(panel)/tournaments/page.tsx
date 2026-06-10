import { Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { categorizeTournaments } from "@/features/tournaments/queries";
import { TournamentCard } from "@/features/tournaments/components/TournamentCard";
import type { Database } from "@/types/database";

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];

export const dynamic = "force-dynamic";

interface DashboardTournamentsPageProps {
  searchParams: Promise<{ tab?: string }>;
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

  // Get owner's primary org
  const { data: ownerOrg } = await admin
    .from("organizations")
    .select("id, slug")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  const orgId = ownerOrg?.id ?? null;
  const orgSlug = ownerOrg?.slug ?? null;

  // Load all tournaments across all orgs owned
  let tournaments: Tournament[] = [];

  if (orgId) {
    const { data } = await admin
      .from("tournaments")
      .select("*")
      .eq("organization_id", orgId)
      .order("start_date", { ascending: false })
      .limit(100);
    tournaments = data ?? [];
  }

  const { upcoming, registered, ongoing, completed, cancelled } =
    categorizeTournaments(tournaments);

  const sp = await searchParams;
  const tab: TabKey =
    sp.tab === "upcoming" ||
    sp.tab === "registered" ||
    sp.tab === "completed" ||
    sp.tab === "all"
      ? sp.tab
      : "ongoing";

  let filtered = ongoing;
  if (tab === "upcoming") filtered = upcoming;
  else if (tab === "registered") filtered = registered;
  else if (tab === "completed") filtered = [...completed, ...cancelled];
  else if (tab === "all") filtered = tournaments;

  return (
    <>
      <main className="space-y-6 px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ui-text">Info Turnamen</h1>
          </div>
          {orgSlug && (
            <Link
              href={`/${orgSlug}/tournaments/new`}
              className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium bg-ui-hover text-ui-text-dim border border-ui-border transition hover:bg-ui-hover-strong hover:text-ui-text cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </Link>
          )}
        </div>

        {/* Tab filter */}
        <nav aria-label="Filter turnamen" className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            const count = t.key === "upcoming" ? upcoming.length : 0;
            return (
              <Link
                key={t.key}
                href={`/dashboard/tournaments?tab=${t.key}`}
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
              {tab === "ongoing"
                ? "Tidak ada turnamen yang sedang berlangsung."
                : tab === "upcoming"
                  ? "Tidak ada turnamen yang belum didaftarkan."
                  : tab === "registered"
                    ? "Belum ada turnamen terdaftar."
                    : tab === "completed"
                      ? "Belum ada turnamen selesai."
                      : "Belum ada turnamen."}
            </p>
            {orgSlug && (
              <Link
                href={`/${orgSlug}/tournaments/new`}
                className="mt-4 inline-flex h-9 items-center rounded px-4 text-sm font-medium border border-ui-border text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text"
              >
                Tambah turnamen pertama
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <li key={t.id}>
                <TournamentCard tournament={t} orgSlug={orgSlug ?? ""} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
