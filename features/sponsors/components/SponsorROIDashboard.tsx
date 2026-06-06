"use client";

import * as React from "react";
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SponsorWithStats } from "../queries";

function formatRupiah(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

const STATUS_LABEL: Record<string, string> = {
  active:   "Aktif",
  pending:  "Pending",
  inactive: "Tidak Aktif",
  prospect: "Prospek",
  ended:    "Selesai",
};

const STATUS_BAR_COLOR: Record<string, string> = {
  active:   "bg-green-500",
  pending:  "bg-yellow-500",
  inactive: "bg-zinc-500",
  prospect: "bg-blue-500",
  ended:    "bg-zinc-600",
};

const STATUS_DOT: Record<string, string> = {
  active:   "bg-green-400",
  pending:  "bg-yellow-400",
  inactive: "bg-zinc-400",
  prospect: "bg-blue-400",
  ended:    "bg-zinc-500",
};

const MAX_VISIBLE = 5;

interface Props {
  sponsors: SponsorWithStats[];
}

const SponsorROIDashboard = ({ sponsors }: Props) => {
  const [showAllDl, setShowAllDl] = React.useState(false);
  if (sponsors.length === 0) return null;

  const activeSponsors   = sponsors.filter((s) => s.status === "active");
  const withDeliverables = activeSponsors.filter((s) => s.deliverableTotal > 0);

  // Overall completion
  const totalDone = withDeliverables.reduce((acc, s) => acc + s.deliverableDone, 0);
  const totalAll  = withDeliverables.reduce((acc, s) => acc + s.deliverableTotal, 0);
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : null;

  // Expiry alerts ≤90 days
  const expiring = sponsors
    .filter((s) => { if (!s.end_date) return false; const d = daysUntil(s.end_date); return d >= 0 && d <= 90; })
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime());

  // Value distribution (IDR only)
  const valueByStatus: Record<string, number> = {};
  let totalIDR = 0;
  for (const s of sponsors) {
    if (s.currency !== "IDR" || !s.deal_value) continue;
    valueByStatus[s.status] = (valueByStatus[s.status] ?? 0) + s.deal_value;
    totalIDR += s.deal_value;
  }
  const sortedStatuses = Object.entries(valueByStatus).sort((a, b) => b[1] - a[1]);

  // Completion colour
  const completionColor =
    overallPct === null ? "text-white/40"
    : overallPct >= 80  ? "text-green-400"
    : overallPct >= 50  ? "text-yellow-400"
    : "text-red-400";

  const completionBarColor =
    overallPct === null ? "bg-white/20"
    : overallPct >= 80  ? "bg-green-400"
    : overallPct >= 50  ? "bg-yellow-400"
    : "bg-red-400";

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-[#2D2D2D] px-5 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-white">ROI Dashboard</h2>
        </div>
        <span className="text-[10px] text-white/25 uppercase tracking-widest">Sponsor Analytics</span>
      </div>

      {/* ── Top KPI strip ────────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-[#2D2D2D] border-b border-[#2D2D2D]">
        {/* Completion Rate */}
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1">Completion Rate</p>
          {overallPct !== null ? (
            <>
              <p className={cn("text-2xl font-bold tabular-nums", completionColor)}>{overallPct}%</p>
              <p className="text-[11px] text-white/30 mt-0.5">{totalDone}/{totalAll} deliverable</p>
              <div className="mt-2 h-1 w-full rounded-full bg-white/10">
                <div
                  className={cn("h-full rounded-full transition-all", completionBarColor)}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-white/25 mt-1">Belum ada data</p>
          )}
        </div>

        {/* Total Deal Value */}
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1">Total Deal (IDR)</p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {totalIDR > 0 ? formatRupiah(totalIDR) : "—"}
          </p>
          <p className="text-[11px] text-white/30 mt-0.5">{sponsors.length} sponsor total</p>
          <div className="mt-2 flex gap-1">
            {sortedStatuses.slice(0, 4).map(([status, val]) => (
              <div
                key={status}
                title={`${STATUS_LABEL[status] ?? status}: ${formatRupiah(val)}`}
                className={cn("h-1 rounded-full transition-all", STATUS_BAR_COLOR[status] ?? "bg-zinc-500")}
                style={{ width: `${Math.round((val / totalIDR) * 100)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Active Ratio */}
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1">Sponsor Aktif</p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {activeSponsors.length}
            <span className="text-sm font-normal text-white/30"> / {sponsors.length}</span>
          </p>
          <p className="text-[11px] text-white/30 mt-0.5">
            {sponsors.length > 0 ? Math.round((activeSponsors.length / sponsors.length) * 100) : 0}% activation rate
          </p>
          {expiring.length > 0 && (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-orange-400">
              <Clock className="h-3 w-3" />
              {expiring.length} segera berakhir
            </p>
          )}
        </div>
      </div>

      {/* ── Body: Deliverable + Expiry ────────────────────────── */}
      <div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#2D2D2D]">

        {/* Deliverable Completion per Sponsor */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Deliverable per Sponsor</span>
          </div>

          {withDeliverables.length === 0 ? (
            <p className="text-xs text-white/25 py-4 text-center">Belum ada deliverable aktif.</p>
          ) : (() => {
            const visible = showAllDl ? withDeliverables : withDeliverables.slice(0, MAX_VISIBLE);
            const hasMore = withDeliverables.length > MAX_VISIBLE;
            return (
              <>
                <div className="space-y-3">
                  {visible.map((s) => {
                    const pct = s.deliverableTotal > 0
                      ? Math.round((s.deliverableDone / s.deliverableTotal) * 100)
                      : 0;
                    const done = pct === 100;
                    return (
                      <div key={s.id}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={cn("truncate text-xs font-medium", done ? "text-white/40" : "text-white/80")}>
                            {s.name}
                          </span>
                          <span className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                            done ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/40"
                          )}>
                            {s.deliverableDone}/{s.deliverableTotal}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", done ? "bg-green-400" : "bg-yellow-400")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setShowAllDl((v) => !v)}
                    className="mt-2 text-[11px] text-white/30 hover:text-white/60 transition cursor-pointer"
                  >
                    {showAllDl
                      ? "Sembunyikan ↑"
                      : `Lihat semua ${withDeliverables.length} sponsor ↓`}
                  </button>
                )}
              </>
            );
          })()}
        </div>

        {/* Expiry Alerts */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Segera Berakhir</span>
            {expiring.length > 0 && (
              <span className="ml-auto rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">
                {expiring.length}
              </span>
            )}
          </div>

          {expiring.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Zap className="h-5 w-5 text-white/15" />
              <p className="text-xs text-white/25">Tidak ada yang berakhir dalam 90 hari.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expiring.map((s) => {
                const d = daysUntil(s.end_date!);
                const urgent  = d <= 14;
                const warning = d <= 30;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5",
                      urgent  ? "border border-red-500/20 bg-red-500/8"
                      : warning ? "border border-orange-500/15 bg-orange-500/6"
                      : "bg-white/4"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/85">{s.name}</p>
                      {s.deal_value && s.currency === "IDR" && (
                        <p className="text-[11px] text-white/40">{formatRupiah(s.deal_value)}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn(
                        "text-xs font-bold tabular-nums",
                        urgent ? "text-red-400" : warning ? "text-orange-400" : "text-white/50"
                      )}>
                        {d} hari
                      </p>
                      <p className="text-[10px] text-white/25">tersisa</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Value Distribution ───────────────────────────────── */}
      {totalIDR > 0 && (
        <div className="border-t border-[#2D2D2D] px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Distribusi Nilai per Status</span>
            </div>
            <span className="text-[11px] text-white/30">Total {formatRupiah(totalIDR)}</span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
            {sortedStatuses.map(([status, val]) => (
              <div
                key={status}
                title={`${STATUS_LABEL[status] ?? status}: ${formatRupiah(val)}`}
                className={cn("h-full transition-all", STATUS_BAR_COLOR[status] ?? "bg-zinc-500")}
                style={{ width: `${(val / totalIDR) * 100}%` }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {sortedStatuses.map(([status, val]) => {
              const pct = Math.round((val / totalIDR) * 100);
              return (
                <div key={status} className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[status] ?? "bg-zinc-400")} />
                  <span className="text-[11px] text-white/50">{STATUS_LABEL[status] ?? status}</span>
                  <span className="text-[11px] font-semibold text-white/70">{formatRupiah(val)}</span>
                  <span className="text-[10px] text-white/25">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Completion footer callout ─────────────────────────── */}
      {overallPct !== null && (
        <div className={cn(
          "border-t border-[#2D2D2D] px-5 py-3 flex items-center gap-3",
          overallPct >= 80 ? "bg-green-500/5" : overallPct >= 50 ? "bg-yellow-500/5" : "bg-red-500/5"
        )}>
          {overallPct >= 80
            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
            : <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
          }
          <p className="text-[11px] text-white/50">
            Completion rate keseluruhan:{" "}
            <span className={cn("font-semibold", completionColor)}>
              {overallPct}% ({totalDone}/{totalAll} deliverable selesai)
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
export { SponsorROIDashboard };
