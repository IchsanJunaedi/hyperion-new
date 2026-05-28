"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import { getHeroStatisticsAction } from "@/features/analytics/actions";
import type { HeroStatRow } from "@/features/analytics/queries";
import { HeroStatDetailModal } from "@/features/analytics/components/HeroStatDetailModal";

type SortKey = keyof Pick<
  HeroStatRow,
  | "pick_total" | "pick_wins" | "pick_losses" | "pick_wr" | "pick_pct"
  | "team_ban_total" | "team_ban_pct"
  | "enemy_ban_total" | "enemy_ban_pct"
  | "pb_total" | "pb_pct"
>;

function SortBtn({
  col,
  sortKey,
  dir,
  onSort,
  children,
}: {
  col: SortKey;
  sortKey: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  children: React.ReactNode;
}) {
  const active = col === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
        active ? "text-yellow-400" : "text-[#6B6A68] hover:text-[#9B9A97]",
      )}
    >
      {children}
      {active && (
        dir === "desc"
          ? <ChevronDown className="h-2.5 w-2.5" />
          : <ChevronUp className="h-2.5 w-2.5" />
      )}
    </button>
  );
}

function WrChip({ wr }: { wr: number }) {
  return (
    <span
      className={cn(
        "inline-block text-[11px] font-semibold",
        wr >= 60
          ? "text-emerald-400"
          : wr >= 50
            ? "text-yellow-400"
            : wr > 0
              ? "text-rose-400"
              : "text-[#4B4A48]",
      )}
    >
      {wr > 0 ? `${wr}%` : "—"}
    </span>
  );
}

// grid: Hero(180) | P.Total P.W P.L P.WR P.%T(5×52) | TB.Total TB.%T(2×52) | EB.Total EB.%T(2×52) | PB.Total PB.%T(2×52) | Details(64)
const GRID =
  "grid-cols-[180px_repeat(5,52px)_repeat(2,52px)_repeat(2,52px)_repeat(2,52px)_64px]";

const StatisticsTab = ({ orgId }: { orgId: string }) => {
  const [rows, setRows] = useState<HeroStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("pb_total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedHero, setSelectedHero] = useState<string | null>(null);

  useEffect(() => {
    getHeroStatisticsAction(orgId).then((res) => {
      if (res.ok) setRows(res.data);
      else toast.error(res.message);
      setLoading(false);
    });
  }, [orgId]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = (a[sortKey] as number) - (b[sortKey] as number);
    return sortDir === "desc" ? -diff : diff;
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl bg-[#1C1C1C]" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C] p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252525]">
          <BarChart2 className="h-6 w-6 text-[#6B6A68]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#E5E2E1]">Belum ada data statistik</p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Selesaikan scrim dengan mengisi draft dan ban hero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C]">
        {/* ── Group header row ── */}
        <div
          className={cn(
            "grid min-w-max border-b border-[#2D2D2D] bg-[#202020] px-3 py-1.5 text-center text-[9px] font-semibold uppercase tracking-wider text-[#6B6A68]",
            GRID,
          )}
        >
          <span className="text-left">Hero</span>
          <span className="col-span-5 border-l border-[#2D2D2D]">Picks</span>
          <span className="col-span-2 border-l border-[#2D2D2D]">Team Bans</span>
          <span className="col-span-2 border-l border-[#2D2D2D]">Enemy Bans</span>
          <span className="col-span-2 border-l border-[#2D2D2D]">Picks &amp; Bans</span>
          <span className="border-l border-[#2D2D2D]">Details</span>
        </div>

        {/* ── Sub-column sort header ── */}
        <div
          className={cn(
            "grid min-w-max border-b border-[#2D2D2D] bg-[#1A1A1A] px-3 py-1.5",
            GRID,
          )}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3B3B3B]">
            —
          </span>
          <SortBtn col="pick_total"  sortKey={sortKey} dir={sortDir} onSort={handleSort}>Tot</SortBtn>
          <SortBtn col="pick_wins"   sortKey={sortKey} dir={sortDir} onSort={handleSort}>W</SortBtn>
          <SortBtn col="pick_losses" sortKey={sortKey} dir={sortDir} onSort={handleSort}>L</SortBtn>
          <SortBtn col="pick_wr"     sortKey={sortKey} dir={sortDir} onSort={handleSort}>WR</SortBtn>
          <SortBtn col="pick_pct"    sortKey={sortKey} dir={sortDir} onSort={handleSort}>%T</SortBtn>
          <SortBtn col="team_ban_total" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Tot</SortBtn>
          <SortBtn col="team_ban_pct"   sortKey={sortKey} dir={sortDir} onSort={handleSort}>%T</SortBtn>
          <SortBtn col="enemy_ban_total" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Tot</SortBtn>
          <SortBtn col="enemy_ban_pct"   sortKey={sortKey} dir={sortDir} onSort={handleSort}>%T</SortBtn>
          <SortBtn col="pb_total" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Tot</SortBtn>
          <SortBtn col="pb_pct"   sortKey={sortKey} dir={sortDir} onSort={handleSort}>%T</SortBtn>
          <span />
        </div>

        {/* ── Data rows ── */}
        <div className="divide-y divide-[#252525]">
          {sorted.map((row) => (
            <div
              key={row.hero_name}
              className={cn(
                "grid min-w-max items-center px-3 py-2 text-center transition-colors hover:bg-[#202020]",
                GRID,
              )}
            >
              {/* Hero */}
              <div className="flex items-center gap-2 text-left">
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getHeroImageUrl(row.hero_name)}
                    alt={row.hero_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="truncate text-xs font-medium text-[#E5E2E1]">
                  {row.hero_name}
                </span>
              </div>

              {/* Picks */}
              <span className="text-xs font-semibold text-[#E5E2E1]">
                {row.pick_total || "—"}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {row.pick_wins || "—"}
              </span>
              <span className="text-xs font-semibold text-rose-400">
                {row.pick_losses || "—"}
              </span>
              <WrChip wr={Number(row.pick_wr)} />
              <span className="text-xs text-[#9B9A97]">
                {Number(row.pick_pct) > 0 ? `${row.pick_pct}%` : "—"}
              </span>

              {/* Team Bans */}
              <span className="text-xs font-semibold text-amber-400">
                {row.team_ban_total || "—"}
              </span>
              <span className="text-xs text-[#9B9A97]">
                {Number(row.team_ban_pct) > 0 ? `${row.team_ban_pct}%` : "—"}
              </span>

              {/* Enemy Bans */}
              <span className="text-xs font-semibold text-violet-400">
                {row.enemy_ban_total || "—"}
              </span>
              <span className="text-xs text-[#9B9A97]">
                {Number(row.enemy_ban_pct) > 0 ? `${row.enemy_ban_pct}%` : "—"}
              </span>

              {/* P&B */}
              <span className="text-xs font-bold text-[#E5E2E1]">
                {row.pb_total || "—"}
              </span>
              <span className="text-xs text-[#9B9A97]">
                {Number(row.pb_pct) > 0 ? `${row.pb_pct}%` : "—"}
              </span>

              {/* Details */}
              <button
                type="button"
                onClick={() => setSelectedHero(row.hero_name)}
                className="cursor-pointer rounded-md border border-[#2D2D2D] px-2 py-1 text-[10px] font-medium text-[#9B9A97] transition hover:border-[#4D4D4D] hover:bg-[#252525] hover:text-[#E5E2E1]"
              >
                Show
              </button>
            </div>
          ))}
        </div>
      </div>

      <HeroStatDetailModal
        orgId={orgId}
        heroName={selectedHero}
        onClose={() => setSelectedHero(null)}
      />
    </>
  );
};
export { StatisticsTab };
