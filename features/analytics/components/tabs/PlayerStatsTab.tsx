"use client";

import { useState } from "react";
import { Gamepad2, Star, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ROLE_LABELS } from "@/features/scrim/data/mlbb-heroes";
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import { PlayerHeroModal } from "@/features/analytics/components/PlayerHeroModal";
import type { EnterprisePlayerStat, PlayerHeroStat } from "@/features/analytics/queries";

function computeImpactScore(p: EnterprisePlayerStat): number {
  const attendance = p.attendanceRate;
  const winRate = p.scrimsWhenPresent > 0 ? p.winRateWhenPresent : 50;
  const rating = p.avgRating !== null ? (p.avgRating / 10) * 100 : 50;
  return Math.round(attendance * 0.35 + winRate * 0.35 + rating * 0.30);
}

function impactColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-amber-500";
  return "text-rose-400";
}

function impactLabel(score: number): string {
  if (score >= 80) return "Elite";
  if (score >= 65) return "Core";
  if (score >= 50) return "Solid";
  if (score >= 35) return "Dev";
  return "Bench";
}

interface PlayerStatsTabProps {
  playerStats: EnterprisePlayerStat[];
  orgId: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function ratingColor(r: number): string {
  if (r >= 8) return "text-emerald-400";
  if (r >= 6) return "text-yellow-400";
  if (r >= 4) return "text-amber-500";
  return "text-rose-400";
}

export function PlayerStatsTab({ playerStats, orgId }: PlayerStatsTabProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<EnterprisePlayerStat | null>(null);

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

  const ranked = [...playerStats]
    .map((p) => ({ ...p, impactScore: computeImpactScore(p) }))
    .sort((a, b) => b.impactScore - a.impactScore);

  return (
    <>
      {/* Player Impact Score leaderboard */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 mb-2">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Player Impact Score</h3>
          <span className="ml-auto text-[10px] text-white/30">Kehadiran 35% · Win Rate 35% · Rating 30%</span>
        </div>
        <div className="space-y-2">
          {ranked.map((p, i) => (
            <div key={p.user_id} className="flex items-center gap-3">
              <span className="w-5 text-center text-[10px] font-bold text-white/30">{i + 1}</span>
              <span className="flex-1 truncate text-xs text-white/70">{p.display_name ?? "Unknown"}</span>
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-semibold", impactColor(p.impactScore))}>
                  {impactLabel(p.impactScore)}
                </span>
                <div className="w-20 h-1.5 rounded-full bg-[#252525] overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", {
                      "bg-emerald-500": p.impactScore >= 80,
                      "bg-yellow-400": p.impactScore >= 65 && p.impactScore < 80,
                      "bg-amber-500": p.impactScore >= 50 && p.impactScore < 65,
                      "bg-rose-500": p.impactScore < 50,
                    })}
                    style={{ width: `${p.impactScore}%` }}
                  />
                </div>
                <span className={cn("w-7 text-right text-xs font-bold tabular-nums", impactColor(p.impactScore))}>
                  {p.impactScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {playerStats.map((player) => (
          <PlayerCard
            key={player.user_id}
            player={player}
            onClick={() => setSelectedPlayer(player)}
          />
        ))}
      </div>

      <PlayerHeroModal
        player={selectedPlayer}
        orgId={orgId}
        onClose={() => setSelectedPlayer(null)}
      />
    </>
  );
}

function PlayerCard({
  player,
  onClick,
}: {
  player: EnterprisePlayerStat;
  onClick: () => void;
}) {
  const impact = computeImpactScore(player);
  const streakPositive = player.streak > 0;
  const streakText =
    player.streak === 0
      ? "—"
      : streakPositive
        ? `${player.streak} hadir beruntun`
        : `${Math.abs(player.streak)} absen terakhir`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="group space-y-4 rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 transition-colors cursor-pointer hover:border-yellow-400/40 hover:bg-[#202020] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
    >
      {/* Header */}
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#E5E2E1] group-hover:text-white transition-colors">
            {player.display_name ?? "Unknown"}
          </p>
          <p className="text-[11px] text-[#6B6A68]">
            {[player.position, player.jersey_number ? `#${player.jersey_number}` : null]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
          {player.main_role && (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-[#252525] px-1.5 py-0.5 text-[10px] font-medium text-[#9B9A97]">
              <Gamepad2 className="h-2.5 w-2.5" />
              {ROLE_LABELS[player.main_role as keyof typeof ROLE_LABELS] ?? player.main_role}
            </span>
          )}
        </div>
        {/* Impact Score + Coach rating */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-col items-center rounded-xl bg-[#252525] px-2 py-1">
            <Zap className="mb-0.5 h-3 w-3 text-yellow-400/60" />
            <span className={cn("text-sm font-bold tabular-nums", impactColor(impact))}>
              {impact}
            </span>
          </div>
          {player.avgRating !== null && (
            <div className="flex flex-col items-center rounded-xl bg-[#252525] px-2 py-1">
              <Star className="mb-0.5 h-3 w-3 text-yellow-400/70" />
              <span className={cn("text-sm font-bold tabular-nums", ratingColor(player.avgRating))}>
                {player.avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Attendance bar */}
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

      <p
        className={cn(
          "text-[11px]",
          streakPositive ? "text-emerald-400/80" : player.streak < 0 ? "text-rose-400/80" : "text-[#6B6A68]",
        )}
      >
        {streakText}
      </p>

      {/* Hero pool (preview — top 5) */}
      {player.heroPool.length > 0 && <HeroPool pool={player.heroPool} />}

      {/* Click hint */}
      <p className="text-center text-[10px] text-[#4B4A48] group-hover:text-[#6B6A68] transition-colors">
        Klik untuk melihat history lengkap →
      </p>
    </div>
  );
}

function HeroPool({ pool }: { pool: PlayerHeroStat[] }) {
  return (
    <div className="space-y-1.5 border-t border-[#2D2D2D] pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Hero Pool</p>
      <div className="space-y-1">
        {pool.map((h) => (
          <div key={`${h.hero_name}:${h.role}`} className="flex items-center gap-2">
            <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getHeroImageUrl(h.hero_name)}
                alt={h.hero_name}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="flex-1 truncate text-[11px] text-[#E5E2E1]">{h.hero_name}</span>
            <span className="text-[10px] text-[#6B6A68]">
              {ROLE_LABELS[h.role as keyof typeof ROLE_LABELS] ?? h.role}
            </span>
            <span className="w-8 text-right text-[10px] text-white">{h.picks}×</span>
            <span
              className={cn(
                "w-9 text-right text-[10px] font-semibold",
                h.winRate >= 50 ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {h.winRate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
