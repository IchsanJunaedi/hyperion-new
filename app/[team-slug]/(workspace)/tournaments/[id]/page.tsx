import { ArrowLeft, Calendar, ExternalLink, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";
import { getTournamentDetail } from "@/features/tournaments/queries";
import { TournamentCountdown } from "@/features/tournaments/components/TournamentCountdown";
import { TournamentTimeline } from "@/features/tournaments/components/TournamentTimeline";
import { TournamentDetailActions } from "@/features/tournaments/components/TournamentDetailActions";

export const dynamic = "force-dynamic";

interface TournamentDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  upcoming: { color: "bg-white/5 text-[#9B9A97] border-white/10", label: "BELUM DAFTAR" },
  ongoing: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "TERDAFTAR" },
  completed: { color: "bg-green-500/10 text-green-400 border-green-500/20", label: "SELESAI" },
  cancelled: { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "DIBATALKAN" },
};

export default async function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { "team-slug": slug, id } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const detail = await getTournamentDetail(id);
  if (!detail) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManage = ["captain", "manager", "owner"].includes(currentUserRole ?? "");

  const badge = STATUS_BADGE[detail.status] ?? STATUS_BADGE["upcoming"] ?? { color: "bg-white/5 text-[#9B9A97] border-white/10", label: "TIDAK DIKETAHUI" };

  const scheduled = new Date(detail.start_date).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-2">
      <div className="flex justify-start">
        <Link
          href={`/${slug}/tournaments`}
          className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke daftar turnamen
        </Link>
      </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.color}`}>
            {badge.label}
          </span>
          {detail.division_name && (
            <span className="text-xs uppercase tracking-wide text-white/55">
              {detail.division_name}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white">{detail.name}</h1>
        {detail.organizer && (
          <p className="text-sm text-white/65">oleh {detail.organizer}</p>
        )}

        {/* Countdown — show when not completed/cancelled */}
        {(detail.status === "upcoming" || detail.status === "ongoing") && (
          <div className="mt-3">
            <TournamentCountdown
              name={detail.name}
              startDate={detail.start_date}
              prizePool={detail.prize_pool}
              organizer={detail.organizer}
            />
          </div>
        )}

        <dl className="grid gap-1 text-sm text-white/70 sm:grid-cols-2">
          <div className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-white/55" />
            {scheduled}
            {detail.end_date && ` — ${new Date(detail.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
          </div>
          {detail.prize_pool && (
            <div className="inline-flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-yellow-400" />
              Rp {detail.prize_pool}
            </div>
          )}
        </dl>
      </header>

      {/* Action buttons — inline like scrim */}
      {canManage && (
        <TournamentDetailActions tournament={detail} orgSlug={slug} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-6">
          {/* Detail info card */}
          {(detail.registration_fee || detail.registration_url || detail.notes) && (
            <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
              <h2 className="text-sm font-semibold text-white">Detail tambahan</h2>

              {detail.registration_fee && (
                <div className="mt-3">
                  <span className="text-xs text-[#6B6A68]">Biaya Registrasi</span>
                  <p className="text-sm text-[#E5E2E1]">Rp {detail.registration_fee}</p>
                </div>
              )}

              {detail.registration_url && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={detail.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-blue-400 hover:bg-white/5 transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link Registrasi
                  </a>
                </div>
              )}

              {detail.notes && (
                <p className="mt-3 whitespace-pre-line text-sm text-white/80">
                  {detail.notes}
                </p>
              )}
            </article>
          )}
        </section>

        <aside className="space-y-6">
          {/* Timeline — show when ongoing or completed */}
          {(detail.status === "ongoing" || detail.status === "completed") && (
            <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
              <TournamentTimeline
                stages={detail.stages}
                tournamentId={detail.id}
                orgSlug={slug}
                canManage={canManage}
              />
            </article>
          )}
        </aside>
      </div>
    </div>
  );
}
