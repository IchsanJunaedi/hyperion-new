import { Calendar, Clock, ExternalLink, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";
import { getTournamentDetail } from "@/features/tournaments/queries";
import { TournamentTimeline } from "@/features/tournaments/components/TournamentTimeline";
import { TournamentDetailActions } from "@/features/tournaments/components/TournamentDetailActions";

export const dynamic = "force-dynamic";

interface TournamentDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ongoing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Belum Daftar",
  upcoming: "Belum Daftar",
  ongoing: "Terdaftar",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export default async function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { "team-slug": slug, id } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const detail = await getTournamentDetail(id);
  if (!detail) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManage = ["captain", "manager", "owner"].includes(currentUserRole ?? "");

  const startDate = new Date(detail.start_date).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  // Calculate days until tournament
  const now = new Date();
  const tournamentDate = new Date(detail.start_date);
  const daysUntil = Math.ceil((tournamentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      {/* Header like scrim */}
      <header className="space-y-2">
        <Link
          href={`/${slug}/tournaments`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Daftar turnamen
        </Link>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[detail.status] ?? STATUS_COLORS.upcoming}`}>
            {STATUS_LABELS[detail.status] ?? detail.status}
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

        {/* Countdown / date info */}
        {(detail.status === "upcoming" || detail.status === "scheduled") && daysUntil > 0 && (
          <div className="mt-3 rounded-xl border border-white/10 bg-zinc-900/60 p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-lg font-bold text-white">{daysUntil} hari lagi</p>
                <p className="text-xs text-white/55">menuju hari pertandingan</p>
              </div>
            </div>
          </div>
        )}

        {detail.status === "ongoing" && (
          <div className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-yellow-400">Turnamen sedang berlangsung</p>
                <p className="text-xs text-white/55">Tim sudah terdaftar</p>
              </div>
            </div>
          </div>
        )}

        <dl className="grid gap-1 text-sm text-white/70 sm:grid-cols-2 mt-2">
          <div className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-white/55" />
            {startDate}
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

      {/* Action buttons for captain+ */}
      {canManage && (
        <TournamentDetailActions
          tournament={detail}
          orgSlug={slug}
          canManage={canManage}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Detail info */}
          <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#E5E2E1]">Informasi</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {detail.registration_fee && (
                <div>
                  <dt className="text-xs text-[#6B6A68]">Biaya Registrasi</dt>
                  <dd className="text-[#E5E2E1]">Rp {detail.registration_fee}</dd>
                </div>
              )}
              {detail.registration_deadline && (
                <div>
                  <dt className="text-xs text-[#6B6A68]">Deadline Registrasi</dt>
                  <dd className="text-[#E5E2E1]">
                    {new Date(detail.registration_deadline).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              )}
            </dl>

            {(detail.link || detail.registration_url) && (
              <div className="flex flex-wrap gap-3 pt-3 border-t border-[#2D2D2D]">
                {detail.link && (
                  <a
                    href={detail.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-blue-400 hover:bg-white/5 transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link Turnamen
                  </a>
                )}
                {detail.registration_url && (
                  <a
                    href={detail.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-blue-400 hover:bg-white/5 transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link Registrasi
                  </a>
                )}
              </div>
            )}

            {detail.notes && (
              <p className="text-sm text-[#9B9A97] whitespace-pre-line pt-3 border-t border-[#2D2D2D]">
                {detail.notes}
              </p>
            )}
          </article>
        </div>

        <aside className="space-y-6">
          {/* Timeline — show when registered (ongoing/completed) */}
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
