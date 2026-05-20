"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Swords, TrendingUp, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ROLE_LABELS } from "@/features/scrim/data/mlbb-heroes";
import { fetchPlayerHeroHistory } from "@/features/analytics/actions";
import type { EnterprisePlayerStat } from "@/features/analytics/queries";
import type { PlayerHeroHistory, PlayerHeroStatExtended, PlayerScrimGame } from "@/features/analytics/actions";

interface PlayerHeroModalProps {
  player: EnterprisePlayerStat | null;
  orgId: string;
  onClose: () => void;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function winRateColor(wr: number): string {
  if (wr >= 60) return "text-emerald-400";
  if (wr >= 50) return "text-yellow-400";
  return "text-rose-400";
}

function winRateBarColor(wr: number): string {
  if (wr >= 60) return "bg-emerald-500";
  if (wr >= 50) return "bg-yellow-400";
  return "bg-rose-500";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Group recentGames by scrim_id
function groupByScrim(games: PlayerScrimGame[]): { scrim_id: string; opponent_name: string; scheduled_at: string; format: string; scrim_is_win: boolean | null; games: PlayerScrimGame[] }[] {
  const scrimMap = new Map<string, { scrim_id: string; opponent_name: string; scheduled_at: string; format: string; scrim_is_win: boolean | null; games: PlayerScrimGame[] }>();
  for (const g of games) {
    if (!scrimMap.has(g.scrim_id)) {
      scrimMap.set(g.scrim_id, {
        scrim_id: g.scrim_id,
        opponent_name: g.opponent_name,
        scheduled_at: g.scheduled_at,
        format: g.format,
        scrim_is_win: g.scrim_is_win,
        games: [],
      });
    }
    scrimMap.get(g.scrim_id)!.games.push(g);
  }
  return Array.from(scrimMap.values());
}

export function PlayerHeroModal({ player, orgId, onClose }: PlayerHeroModalProps) {
  const [data, setData] = useState<PlayerHeroHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<"picks" | "winRate">("picks");

  const load = useCallback(async () => {
    if (!player) return;
    setLoading(true);
    setData(null);
    try {
      const result = await fetchPlayerHeroHistory(orgId, player.user_id);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [player, orgId]);

  useEffect(() => {
    if (player) {
      load();
    } else {
      setData(null);
    }
  }, [player, load]);

  useEffect(() => {
    if (!player) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [player, onClose]);

  if (!player) return null;

  const sortedHeroStats = data
    ? [...data.heroStats].sort((a, b) =>
        sortKey === "picks"
          ? b.picks - a.picks || b.winRate - a.winRate
          : b.winRate - a.winRate || b.picks - a.picks,
      )
    : [];

  const groupedScrims = data ? groupByScrim(data.recentGames) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#181818] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-4 border-b border-[#2D2D2D] bg-[#1C1C1C] px-6 py-4">
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.display_name ?? "Player"}
              className="h-12 w-12 rounded-full border border-[#2D2D2D] object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#2D2D2D] bg-[#252525] text-sm font-bold text-[#9B9A97]">
              {getInitials(player.display_name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-[#E5E2E1]">
              {player.display_name ?? "Unknown"}
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {player.main_role && (
                <span className="inline-flex items-center gap-1 rounded bg-[#252525] px-1.5 py-0.5 text-[10px] font-medium text-[#9B9A97]">
                  <Gamepad2 className="h-2.5 w-2.5" />
                  {ROLE_LABELS[player.main_role as keyof typeof ROLE_LABELS] ?? player.main_role}
                </span>
              )}
              {player.jersey_number && (
                <span className="text-[11px] text-[#6B6A68]">#{player.jersey_number}</span>
              )}
              <span className="text-[11px] text-[#6B6A68]">
                WR hadir: <span className={cn("font-semibold", player.winRateWhenPresent >= 50 ? "text-emerald-400" : "text-rose-400")}>{player.winRateWhenPresent}%</span>
              </span>
              <span className="text-[11px] text-[#6B6A68]">
                Hadir: <span className="font-semibold text-[#D4D4D4]">{player.attendanceRate}%</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-[#6B6A68] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="space-y-4 p-6">
              {/* Skeleton */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-[#252525]" />
              ))}
            </div>
          )}

          {!loading && data && data.heroStats.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Swords className="h-8 w-8 text-[#3D3D3D]" />
              <p className="text-sm text-[#6B6A68]">Belum ada data draft pick untuk player ini.</p>
              <p className="text-xs text-[#4B4A48]">
                Data muncul setelah scrim dicatat dengan player_id.
              </p>
            </div>
          )}

          {!loading && data && data.heroStats.length > 0 && (
            <div className="space-y-6 p-6">
              {/* ── Hero Pool ── */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#9B9A97]" />
                    <h3 className="text-sm font-semibold text-[#E5E2E1]">Hero Pool</h3>
                    <span className="rounded bg-[#252525] px-1.5 py-0.5 text-[10px] text-[#6B6A68]">
                      {data.heroStats.length} hero
                    </span>
                  </div>
                  {/* Sort toggle */}
                  <div className="flex gap-1">
                    {(["picks", "winRate"] as const).map((key) => (
                      <button
                        key={key}
                        onClick={() => setSortKey(key)}
                        className={cn(
                          "rounded px-2 py-0.5 text-[11px] font-medium transition",
                          sortKey === key
                            ? "bg-yellow-400 text-black"
                            : "bg-[#252525] text-[#6B6A68] hover:text-[#D4D4D4]",
                        )}
                      >
                        {key === "picks" ? "Picks" : "Win Rate"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#2D2D2D]">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_80px_60px_60px_60px_56px] gap-2 bg-[#202020] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">
                    <span>Hero</span>
                    <span>Role</span>
                    <span className="text-center">Picks</span>
                    <span className="text-center">W</span>
                    <span className="text-center">L</span>
                    <span className="text-center">WR</span>
                  </div>

                  <div className="divide-y divide-[#252525]">
                    {sortedHeroStats.map((h: PlayerHeroStatExtended, idx) => (
                      <div
                        key={`${h.hero_name}:${h.role}`}
                        className="grid grid-cols-[1fr_80px_60px_60px_60px_56px] items-center gap-2 px-4 py-2.5 transition-colors hover:bg-[#202020]"
                      >
                        {/* Hero name + winrate bar */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#252525] text-[9px] font-bold text-[#9B9A97]">
                              {idx + 1}
                            </span>
                            <span className="truncate text-xs font-medium text-[#E5E2E1]">
                              {h.hero_name}
                            </span>
                          </div>
                          {/* Mini winrate bar */}
                          <div className="mt-1 ml-7 h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-[#252525]">
                            <div
                              className={cn("h-full rounded-full transition-all", winRateBarColor(h.winRate))}
                              style={{ width: `${h.winRate}%` }}
                            />
                          </div>
                        </div>

                        <span className="truncate text-[10px] text-[#6B6A68]">
                          {ROLE_LABELS[h.role as keyof typeof ROLE_LABELS] ?? h.role}
                        </span>
                        <span className="text-center text-xs font-semibold text-[#E5E2E1]">{h.picks}</span>
                        <span className="text-center text-xs font-semibold text-emerald-400">{h.wins}</span>
                        <span className="text-center text-xs font-semibold text-rose-400">{h.losses}</span>
                        <span className={cn("text-center text-xs font-bold", winRateColor(h.winRate))}>
                          {h.winRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── Scrim History ── */}
              {groupedScrims.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Swords className="h-4 w-4 text-[#9B9A97]" />
                    <h3 className="text-sm font-semibold text-[#E5E2E1]">Scrim History</h3>
                    <span className="rounded bg-[#252525] px-1.5 py-0.5 text-[10px] text-[#6B6A68]">
                      {groupedScrims.length} scrim
                    </span>
                  </div>

                  <div className="space-y-2">
                    {groupedScrims.map((scrim) => (
                      <div
                        key={scrim.scrim_id}
                        className="overflow-hidden rounded-xl border border-[#2D2D2D] bg-[#1C1C1C]"
                      >
                        {/* Scrim header */}
                        <div className="flex items-center justify-between gap-3 border-b border-[#252525] bg-[#202020] px-4 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={cn(
                                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold",
                                scrim.scrim_is_win === true
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : scrim.scrim_is_win === false
                                    ? "bg-rose-500/15 text-rose-400"
                                    : "bg-[#252525] text-[#6B6A68]",
                              )}
                            >
                              {scrim.scrim_is_win === true ? "WIN" : scrim.scrim_is_win === false ? "LOSE" : "DRAW"}
                            </span>
                            <span className="truncate text-xs font-semibold text-[#D4D4D4]">
                              vs {scrim.opponent_name}
                            </span>
                            <span className="shrink-0 rounded bg-[#252525] px-1.5 py-0.5 text-[9px] font-medium uppercase text-[#6B6A68]">
                              {scrim.format}
                            </span>
                          </div>
                          <span className="shrink-0 text-[11px] text-[#6B6A68]">
                            {formatDate(scrim.scheduled_at)}
                          </span>
                        </div>

                        {/* Per-game picks */}
                        <div className="divide-y divide-[#252525]">
                          {scrim.games.map((g) => (
                            <div
                              key={`${g.scrim_id}:${g.game_number}`}
                              className="flex items-center gap-3 px-4 py-2"
                            >
                              <span className="text-[10px] text-[#4B4A48]">G{g.game_number}</span>
                              <span
                                className={cn(
                                  "w-10 shrink-0 text-center text-[10px] font-bold",
                                  g.game_is_win ? "text-emerald-400" : "text-rose-400",
                                )}
                              >
                                {g.game_is_win ? "W" : "L"}
                              </span>
                              <span className="flex-1 truncate text-xs text-[#D4D4D4]">
                                {g.hero_name}
                              </span>
                              <span className="text-[10px] text-[#6B6A68]">
                                {ROLE_LABELS[g.role as keyof typeof ROLE_LABELS] ?? g.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
