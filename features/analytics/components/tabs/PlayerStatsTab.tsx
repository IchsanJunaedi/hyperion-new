import { Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PlayerStat } from "@/features/analytics/queries";

interface PlayerStatsTabProps {
  playerStats: PlayerStat[];
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function PlayerStatsTab({ playerStats }: PlayerStatsTabProps) {
  if (playerStats.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C] p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252525]">
          <Users className="h-6 w-6 text-[#6B6A68]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#E5E2E1]">Belum ada data player</p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Data muncul setelah ada scrim selesai dengan anggota aktif.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {playerStats.map((player) => (
        <PlayerCard key={player.user_id} player={player} />
      ))}
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerStat }) {
  const streakPositive = player.streak > 0;
  const streakText =
    player.streak === 0
      ? "—"
      : streakPositive
        ? `${player.streak} hadir beruntun`
        : `${Math.abs(player.streak)} absen terakhir`;

  return (
    <div className="space-y-4 rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 transition-colors hover:border-[#3D3D3D]">
      {/* Header: avatar + nama */}
      <div className="flex items-center gap-3">
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt={player.display_name ?? "Player"}
            className="h-10 w-10 rounded-full border border-[#2D2D2D] object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2D2D2D] bg-[#252525] text-xs font-bold text-[#9B9A97]">
            {getInitials(player.display_name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#E5E2E1]">
            {player.display_name ?? "Unknown"}
          </p>
          <p className="text-[11px] text-[#6B6A68]">
            {[
              player.position,
              player.jersey_number ? `#${player.jersey_number}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#9B9A97]">Kehadiran</span>
          <span className="font-semibold text-[#E5E2E1]">{player.attendanceRate}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#252525]">
          <div
            style={{ width: `${player.attendanceRate}%` }}
            className={cn(
              "h-full rounded-full transition-all",
              player.attendanceRate >= 75
                ? "bg-emerald-500/70"
                : player.attendanceRate >= 50
                  ? "bg-yellow-400/70"
                  : "bg-rose-500/70",
            )}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#252525] p-3">
        <div className="text-center">
          <p className="text-[10px] text-[#6B6A68]">Hadir</p>
          <p className="text-sm font-bold text-[#E5E2E1]">{player.totalPresent}</p>
        </div>
        <div className="border-x border-[#2D2D2D] text-center">
          <p className="text-[10px] text-[#6B6A68]">WR Hadir</p>
          <p
            className={cn(
              "text-sm font-bold",
              player.winRateWhenPresent >= 50 ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {player.scrimsWhenPresent === 0 ? "—" : `${player.winRateWhenPresent}%`}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#6B6A68]">Streak</p>
          <p
            className={cn(
              "text-sm font-bold",
              player.streak > 0
                ? "text-emerald-400"
                : player.streak < 0
                  ? "text-rose-400"
                  : "text-[#6B6A68]",
            )}
          >
            {player.streak === 0 ? "—" : Math.abs(player.streak)}
          </p>
        </div>
      </div>

      {/* Streak label */}
      <p
        className={cn(
          "text-[11px]",
          streakPositive
            ? "text-emerald-400/80"
            : player.streak < 0
              ? "text-rose-400/80"
              : "text-[#6B6A68]",
        )}
      >
        {streakText}
      </p>
    </div>
  );
}
