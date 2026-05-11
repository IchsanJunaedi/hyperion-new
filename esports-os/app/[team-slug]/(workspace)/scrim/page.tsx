import { Plus, Swords } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScrimCard } from "@/features/scrim/components/ScrimCard";
import { listScrims, type ScrimListFilter } from "@/features/scrim/queries";
import { getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface ScrimListPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS: Array<{ key: ScrimListFilter; label: string }> = [
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Selesai" },
  { key: "all", label: "Semua" },
];

export default async function ScrimListPage({
  params,
  searchParams,
}: ScrimListPageProps) {
  const [{ "team-slug": slug }, sp] = await Promise.all([params, searchParams]);
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const filter: ScrimListFilter =
    sp.tab === "ongoing" || sp.tab === "completed" || sp.tab === "all"
      ? sp.tab
      : "upcoming";

  const scrims = await listScrims(organization.id, filter);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">Scrim</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Daftar scrim
          </h1>
        </div>
        <Link
          href={`/${slug}/scrim/new`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" />
          Buat scrim
        </Link>
      </header>

      <nav aria-label="Filter scrim" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/${slug}/scrim?tab=${tab.key}`}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-medium transition ${
                active
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-white/70 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {scrims.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <Swords className="mx-auto h-8 w-8 text-white/35" />
          <p className="mt-3 text-sm text-white/65">
            {filter === "upcoming"
              ? "Belum ada scrim terjadwal."
              : filter === "ongoing"
                ? "Tidak ada scrim yang sedang berlangsung."
                : filter === "completed"
                  ? "Belum ada scrim selesai."
                  : "Belum ada scrim."}
          </p>
          <Link
            href={`/${slug}/scrim/new`}
            className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/5"
          >
            Buat scrim pertama
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {scrims.map((s) => (
            <li key={s.id}>
              <ScrimCard scrim={s} orgSlug={slug} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
