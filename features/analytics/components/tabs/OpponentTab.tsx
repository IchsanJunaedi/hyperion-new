"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Swords } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils/cn";
import { getOpponentSummaryAction } from "@/features/analytics/actions";
import type { OpponentSummary } from "@/features/analytics/queries";

type SortKey = keyof Pick<OpponentSummary, "total" | "wins" | "losses" | "draws" | "winRate">;

const GRID = "grid-cols-[1fr_repeat(5,64px)]";

const OpponentTab = ({ orgId }: { orgId: string }) => {
  const [rows, setRows] = useState<OpponentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    let mounted = true;
    getOpponentSummaryAction(orgId).then((res) => {
      if (!mounted) return;
      if (res.ok) setRows(res.data);
      else toast.error(res.message);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [orgId]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === "desc" ? -diff : diff;
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl bg-[#1C1C1C]" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C] p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252525]">
          <Swords className="h-6 w-6 text-[#6B6A68]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#E5E2E1]">Belum ada riwayat lawan</p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Data muncul setelah ada scrim selesai dengan hasil tercatat.
          </p>
        </div>
      </div>
    );
  }

  const Th = ({ col, children }: { col: SortKey; children: React.ReactNode }) => {
    const active = col === sortKey;
    return (
      <button
        type="button"
        onClick={() => handleSort(col)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
          active ? "text-yellow-400" : "text-[#6B6A68] hover:text-[#9B9A97]",
        )}
      >
        {children}
        {active &&
          (sortDir === "desc" ? (
            <ChevronDown className="h-2.5 w-2.5" />
          ) : (
            <ChevronUp className="h-2.5 w-2.5" />
          ))}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C]">
      {/* Header */}
      <div className={cn("grid min-w-max border-b border-[#2D2D2D] bg-[#1A1A1A] px-3 py-2", GRID)}>
        <span className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">
          Lawan
        </span>
        <Th col="total">Main</Th>
        <Th col="wins">W</Th>
        <Th col="losses">L</Th>
        <Th col="draws">D</Th>
        <Th col="winRate">WR</Th>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#252525]">
        {sorted.map((row) => (
          <div
            key={row.opponent_name}
            className={cn("grid min-w-max items-center px-3 py-2.5 text-center transition-colors hover:bg-[#202020]", GRID)}
          >
            <span className="truncate text-left text-xs font-medium text-[#E5E2E1]">
              {row.opponent_name}
            </span>
            <span className="text-xs font-semibold text-[#E5E2E1]">{row.total}</span>
            <span className="text-xs font-semibold text-emerald-400">{row.wins || "—"}</span>
            <span className="text-xs font-semibold text-rose-400">{row.losses || "—"}</span>
            <span className="text-xs text-[#9B9A97]">{row.draws || "—"}</span>
            <span
              className={cn(
                "text-xs font-bold",
                row.wins + row.losses === 0
                  ? "text-[#4B4A48]"
                  : row.winRate >= 50
                    ? "text-emerald-400"
                    : "text-rose-400",
              )}
            >
              {row.wins + row.losses === 0 ? "—" : `${row.winRate}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export { OpponentTab };
