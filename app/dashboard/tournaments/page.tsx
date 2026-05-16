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

  if (!user) redirect("/login?next=/dashboard/tournaments");

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);
  if (!isOwner) redirect("/dashboard");

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
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">
            Turnamen
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Info Turnamen
          </h1>
        </div>
        {orgSlug && (
          <Link
            href={`/${orgSlug}/tournaments/new`}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Link>
        )}
      </header>

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
              className={`relative inline-flex h-9 items-center rounded-full px-4 text-xs font-medium transition ${
                active
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-white/70 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {t.label}
              {count > 0 && !active && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-black">
                  {count}
                </span>
              )}
              {count > 0 && active && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-black/20 px-1 text-[10px] font-bold text-black/70">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <Trophy className="mx-auto h-8 w-8 text-white/35" />
          <p className="mt-3 text-sm text-white/65">
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
              className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/5"
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
    </div>
  );
}
