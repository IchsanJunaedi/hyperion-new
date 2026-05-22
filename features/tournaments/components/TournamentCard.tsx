"use client";

import { Calendar, Trophy } from "lucide-react";
import Link from "next/link";

import type { Tournament } from "@/features/tournaments/queries";

interface TournamentCardProps {
  tournament: Tournament;
  orgSlug: string;
}

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-white/5 text-[#9B9A97]",
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

export function TournamentCard({ tournament, orgSlug }: TournamentCardProps) {
  const startDate = new Date(tournament.start_date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isRegistrationExpired =
    tournament.status === "upcoming" &&
    tournament.registration_deadline != null &&
    new Date(tournament.registration_deadline) < new Date();

  const displayStatus = isRegistrationExpired ? "expired" : tournament.status;

  return (
    <Link
      href={`/${orgSlug}/tournaments/${tournament.id}`}
      className="block rounded-xl border border-[#2D2D2D] bg-[#202020] p-4 transition hover:border-[#3D3D3D] hover:bg-[#252525]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-[#E5E2E1] truncate">{tournament.name}</h3>
          {tournament.organizer && (
            <p className="text-xs text-[#6B6A68] mt-0.5 truncate">{tournament.organizer}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[displayStatus] ?? STATUS_COLORS.upcoming}`}>
          {STATUS_LABELS[displayStatus] ?? tournament.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#9B9A97]">
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
    </Link>
  );
}
