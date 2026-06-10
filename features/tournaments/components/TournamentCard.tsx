"use client";

import { Calendar, Trophy } from "lucide-react";
import Link from "next/link";

import type { Tournament } from "@/features/tournaments/queries";

const PLACEMENT_BADGE: Record<number, { label: string; color: string }> = {
  1: { label: "Juara 1", color: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300" },
  2: { label: "Juara 2", color: "border-zinc-400/30 bg-zinc-400/10 text-ui-text-dim" },
  3: { label: "Juara 3", color: "border-orange-600/30 bg-orange-600/10 text-orange-400" },
};

interface TournamentCardProps {
  tournament: Tournament;
  orgSlug: string;
  placement?: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-ui-elevated text-ui-text-2",
  expired: "bg-orange-500/10 text-orange-400",
  ongoing: "bg-yellow-500/10 text-yellow-400",
  completed: "bg-green-500/10 text-green-400",
  cancelled: "bg-red-500/10 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Belum Daftar",
  expired: "Kadaluarsa",
  ongoing: "Terdaftar",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const TournamentCard = ({ tournament, orgSlug, placement }: TournamentCardProps) => {
  const startDate = new Date(tournament.start_date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isRegistrationExpired =
    tournament.status === "upcoming" &&
    ((tournament.registration_deadline != null &&
      new Date(tournament.registration_deadline) < new Date()) ||
     new Date(`${tournament.start_date}T${tournament.start_time || "00:00"}:00+07:00`) <= new Date());

  const tournamentStarted = new Date(`${tournament.start_date}T${tournament.start_time || "00:00"}:00+07:00`) <= new Date();
  const isActivePlaying = tournament.status === "ongoing" && tournamentStarted;

  const displayStatus = isRegistrationExpired ? "expired" : tournament.status;
  const displayLabel = isActivePlaying
    ? "Berlangsung"
    : (STATUS_LABELS[displayStatus] ?? tournament.status);
  const displayColor = isActivePlaying
    ? "bg-blue-500/10 text-blue-400"
    : (STATUS_COLORS[displayStatus] ?? STATUS_COLORS.upcoming);

  return (
    <Link
      href={`/${orgSlug}/tournaments/${tournament.id}`}
      className="block rounded-xl border border-ui-border bg-ui-surface p-4 transition hover:border-[#3D3D3D] hover:bg-ui-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-ui-text truncate">{tournament.name}</h3>
          {tournament.organizer && (
            <p className="text-xs text-ui-text-muted mt-0.5 truncate">{tournament.organizer}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${displayColor}`}>
          {displayLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ui-text-2">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {startDate}
        </span>
        {tournament.prize_pool && (
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3 w-3 text-yellow-400" />
            Rp {tournament.prize_pool}
          </span>
        )}
      </div>

      {tournament.status === "completed" && placement != null && (
        <div className="mt-2">
          {PLACEMENT_BADGE[placement] ? (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${PLACEMENT_BADGE[placement].color}`}>
              <Trophy className="h-2.5 w-2.5" />
              {PLACEMENT_BADGE[placement].label}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium text-ui-text-2">
              <Trophy className="h-2.5 w-2.5" />
              Juara {placement}
            </span>
          )}
        </div>
      )}
    </Link>
  );
};
export { TournamentCard };
