import { Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug, getPublicTeamData } from "@/features/teams/queries";
import { listTournaments, categorizeTournaments } from "@/features/tournaments/queries";
import { TournamentCard } from "@/features/tournaments/components/TournamentCard";

export const dynamic = "force-dynamic";

interface TournamentsPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function TournamentsPage({ params }: TournamentsPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManage = ["captain", "manager", "owner"].includes(currentUserRole ?? "");

  const tournaments = await listTournaments(organization.id);
  const { upcoming, ongoing, completed, cancelled } = categorizeTournaments(tournaments);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">Turnamen</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl mt-1">Info Turnamen</h1>
        </div>
        {canManage && (
          <Link
            href={`/${slug}/tournaments/new`}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Link>
        )}
      </header>

      {tournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <Trophy className="mx-auto h-8 w-8 text-white/35" />
          <p className="mt-3 text-sm text-white/65">Belum ada info turnamen.</p>
          {canManage && (
            <Link
              href={`/${slug}/tournaments/new`}
              className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/5"
            >
              Tambah turnamen pertama
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {ongoing.length > 0 && (
            <TournamentPanel title="Sedang Berlangsung" tournaments={ongoing} orgSlug={slug} />
          )}
          {upcoming.length > 0 && (
            <TournamentPanel title="Upcoming" tournaments={upcoming} orgSlug={slug} />
          )}
          {completed.length > 0 && (
            <TournamentPanel title="Selesai" tournaments={completed} orgSlug={slug} />
          )}
          {cancelled.length > 0 && (
            <TournamentPanel title="Dibatalkan" tournaments={cancelled} orgSlug={slug} />
          )}
        </div>
      )}
    </div>
  );
}

function TournamentPanel({
  title,
  tournaments,
  orgSlug,
}: {
  title: string;
  tournaments: Array<{ id: string; [key: string]: unknown }>;
  orgSlug: string;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[#9B9A97] mb-3">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t as never} orgSlug={orgSlug} />
        ))}
      </div>
    </section>
  );
}
