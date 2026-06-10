import { ArrowLeft, Calendar, ExternalLink, Medal, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";
import { getTournamentDetail } from "@/features/tournaments/queries";
import { TournamentCountdown } from "@/features/tournaments/components/TournamentCountdown";
import { TournamentTimeline } from "@/features/tournaments/components/TournamentTimeline";
import { TournamentJourney } from "@/features/tournaments/components/TournamentJourney";
import { TournamentDetailActions } from "@/features/tournaments/components/TournamentDetailActions";
import { TournamentBracketCard } from "@/features/tournaments/components/TournamentBracketCard";
import { TournamentTechMeetCard } from "@/features/tournaments/components/TournamentTechMeetCard";

export const dynamic = "force-dynamic";

interface TournamentDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

const PLACEMENT_STYLE: Record<number, { gradient: string; ring: string; textColor: string; label: string }> = {
  1: {
    gradient: "from-yellow-500/20 via-yellow-400/10 to-transparent",
    ring: "border-yellow-400/40",
    textColor: "text-yellow-300",
    label: "JUARA 1",
  },
  2: {
    gradient: "from-zinc-400/20 via-zinc-300/10 to-transparent",
    ring: "border-zinc-400/40",
    textColor: "text-zinc-300",
    label: "JUARA 2",
  },
  3: {
    gradient: "from-orange-700/20 via-orange-600/10 to-transparent",
    ring: "border-orange-600/40",
    textColor: "text-orange-400",
    label: "JUARA 3",
  },
};

function PlacementBanner({ placement, prizeEarned }: { placement: number; prizeEarned: string | null }) {
  const style = PLACEMENT_STYLE[placement] ?? {
    gradient: "from-white/10 to-transparent",
    ring: "border-white/20",
    textColor: "text-white/70",
    label: `JUARA ${placement}`,
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${style.ring} ${style.gradient}`}>
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border ${style.ring} bg-black/30`}>
          {placement <= 3 ? (
            <Medal className={`h-7 w-7 ${style.textColor}`} />
          ) : (
            <Trophy className={`h-7 w-7 ${style.textColor}`} />
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Hasil Turnamen</p>
          <p className={`text-3xl font-black tracking-tight ${style.textColor}`}>{style.label}</p>
          {prizeEarned && (
            <p className="mt-0.5 text-sm font-semibold text-white/60">
              Prize: Rp {Number(prizeEarned).toLocaleString("id-ID")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  upcoming: { color: "bg-white/5 text-ui-text-2 border-white/10", label: "BELUM DAFTAR" },
  expired: { color: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "KADALUARSA" },
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
  const canManageBracket = ["captain", "manager", "owner", "coach"].includes(currentUserRole ?? "");

  const startTimeStr = detail.start_time ? detail.start_time.slice(0, 5) : "00:00";
  const isRegistrationExpired =
    detail.status === "upcoming" &&
    ((detail.registration_deadline != null &&
      new Date(detail.registration_deadline).getTime() < Date.now()) ||
     new Date(`${detail.start_date}T${startTimeStr}:00+07:00`).getTime() <= Date.now());

  const tournamentStarted = new Date(`${detail.start_date}T${startTimeStr}:00+07:00`).getTime() <= Date.now();
  const badgeKey = isRegistrationExpired ? "expired" : detail.status;
  let badge = STATUS_BADGE[badgeKey] ?? STATUS_BADGE["upcoming"] ?? { color: "bg-white/5 text-ui-text-2 border-white/10", label: "TIDAK DIKETAHUI" };
  if (detail.status === "ongoing" && tournamentStarted) {
    badge = { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "BERLANGSUNG" };
  }

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
        <h1 className="text-3xl font-bold text-ui-text">{detail.name}</h1>
        {detail.organizer && (
          <p className="text-sm text-white/65">oleh {detail.organizer}</p>
        )}

        {/* Countdown or Expired Banner */}
        {isRegistrationExpired ? (
          <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-red-400">
              <Calendar className="h-3.5 w-3.5" />
              Pendaftaran Ditutup
            </div>
            <h3 className="mt-3 text-xl font-bold text-ui-text sm:text-2xl">
              {detail.name}
            </h3>
            {detail.organizer && (
              <p className="mt-1 text-xs uppercase tracking-wide text-white/55">
                oleh {detail.organizer}
              </p>
            )}
            <p className="mt-4 text-sm text-white/70">
              Turnamen ini sudah dimulai atau batas waktu pendaftaran telah lewat, dan tim Anda belum terdaftar.
            </p>
          </div>
        ) : (
          (detail.status === "upcoming" || detail.status === "ongoing") && (
            <div className="mt-3">
              <TournamentCountdown
                name={detail.name}
                startDate={detail.start_date}
                startTime={detail.start_time}
                prizePool={detail.prize_pool}
                organizer={detail.organizer}
                registrationDeadline={detail.registration_deadline}
                status={detail.status}
              />
            </div>
          )
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

      {/* Placement result banner for completed tournaments */}
      {detail.status === "completed" && detail.result && detail.result.placement != null && (
        <PlacementBanner placement={detail.result.placement} prizeEarned={detail.result.prize_earned} />
      )}

      {/* Action buttons — inline like scrim */}
      {canManage && (
        <TournamentDetailActions tournament={detail} orgSlug={slug} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-6">
          <TournamentBracketCard
            orgSlug={slug}
            orgId={organization.id}
            tournamentId={detail.id}
            initialBracketLink={detail.bracket_link}
            initialBracketFilePath={detail.bracket_file_path}
            canManage={canManageBracket}
          />

          {/* Detail info card */}
          {(detail.registration_fee || detail.registration_url || detail.notes) && (
            <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
              <h2 className="text-sm font-semibold text-ui-text">Detail tambahan</h2>

              {detail.registration_fee && (
                <div className="mt-3">
                  <span className="text-xs text-ui-text-muted">Biaya Registrasi</span>
                  <p className="text-sm text-ui-text">Rp {detail.registration_fee}</p>
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
          {/* Visual journey — show when there are completed stages with matches */}
          {detail.stages.some((s) => s.matches.length > 0) && (
            <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
              <h3 className="mb-3 text-sm font-semibold text-ui-text">Perjalanan Turnamen</h3>
              <TournamentJourney stages={detail.stages} tournamentName={detail.name} />
            </article>
          )}

          {/* Timeline — show for all active statuses */}
          {(detail.status === "upcoming" || detail.status === "ongoing" || detail.status === "completed") && (
            <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
              <TournamentTimeline
                stages={detail.stages}
                tournamentId={detail.id}
                orgSlug={slug}
                canManage={canManage}
              />
            </article>
          )}

          {/* Tech Meeting */}
          {(detail.status === "upcoming" || detail.status === "ongoing") && (
            <TournamentTechMeetCard
              orgSlug={slug}
              tournamentId={detail.id}
              initialDate={detail.tech_meet_date ?? null}
              initialTime={detail.tech_meet_time ?? null}
              initialLink={detail.tech_meet_link ?? null}
              canManage={canManage}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
