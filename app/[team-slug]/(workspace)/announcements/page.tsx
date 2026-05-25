import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import {
  listAnnouncements,
  getAnnouncementReadCountsBatch,
  type AnnouncementListFilter,
} from "@/features/announcements/queries";
import { getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface AnnouncementsPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS: Array<{ key: AnnouncementListFilter; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "pinned", label: "Pinned" },
];

export default async function AnnouncementsPage({
  params,
  searchParams,
}: AnnouncementsPageProps) {
  const [{ "team-slug": slug }, sp] = await Promise.all([params, searchParams]);
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const filter: AnnouncementListFilter =
    sp.tab === "pinned" ? "pinned" : "all";

  const announcements = await listAnnouncements(organization.id, filter);

  // Fetch read counts for captain+ roles only
  let readCounts: Map<string, number> = new Map();
  let totalMembers: number | undefined;
  if (user && announcements.length > 0) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .maybeSingle();
    const role = membership?.role ?? "";
    const canSeeReadCounts = ["captain", "coach", "manager", "owner"].includes(role);
    if (canSeeReadCounts) {
      const [counts, { count }] = await Promise.all([
        getAnnouncementReadCountsBatch(announcements.map((a) => a.id)),
        supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organization.id)
          .eq("is_active", true),
      ]);
      readCounts = counts;
      totalMembers = count ?? undefined;
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Pengumuman Tim
          </h1>
        </div>
        <Link
          href={`/${slug}/announcements/new`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" />
          Buat pengumuman
        </Link>
      </header>

      <nav aria-label="Filter pengumuman" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/${slug}/announcements?tab=${tab.key}`}
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

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-white/35" />
          <p className="mt-3 text-sm text-white/65">
            {filter === "pinned"
              ? "Belum ada pengumuman yang di-pin."
              : "Belum ada pengumuman."}
          </p>
          <Link
            href={`/${slug}/announcements/new`}
            className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/5"
          >
            Buat pengumuman pertama
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              orgSlug={slug}
              readCount={readCounts.size > 0 ? (readCounts.get(a.id) ?? 0) : undefined}
              totalMembers={totalMembers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
