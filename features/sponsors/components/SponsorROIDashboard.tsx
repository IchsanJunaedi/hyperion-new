"use client";

import { TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3 } from "lucide-react";
import type { SponsorWithStats } from "../queries";

function formatRupiah(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

interface SponsorROIDashboardProps {
  sponsors: SponsorWithStats[];
}

export function SponsorROIDashboard({ sponsors }: SponsorROIDashboardProps) {
  const activeSponsors = sponsors.filter((s) => s.status === "active");

  // Deliverable completion for active sponsors with deliverables
  const withDeliverables = activeSponsors.filter((s) => s.deliverableTotal > 0);

  // Upcoming renewals within 90 days
  const upcoming = sponsors
    .filter((s) => {
      if (!s.end_date) return false;
      const d = daysUntil(s.end_date);
      return d >= 0 && d <= 90;
    })
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime());

  // Value distribution by status (IDR only)
  const valueByStatus: Record<string, number> = {};
  let totalIDR = 0;
  for (const s of sponsors) {
    if (s.currency !== "IDR" || !s.deal_value) continue;
    valueByStatus[s.status] = (valueByStatus[s.status] ?? 0) + s.deal_value;
    totalIDR += s.deal_value;
  }

  const statusOrder = ["active", "pending", "inactive"] as const;
  const statusLabel: Record<string, string> = {
    active: "Aktif",
    pending: "Pending",
    inactive: "Tidak Aktif",
    prospect: "Prospek",
    ended: "Selesai",
  };
  const statusColor: Record<string, string> = {
    active: "bg-green-500",
    pending: "bg-yellow-500",
    inactive: "bg-zinc-500",
    prospect: "bg-blue-500",
    ended: "bg-zinc-600",
  };

  if (sponsors.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-yellow-400" />
        <h2 className="text-sm font-semibold text-white">ROI Dashboard</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Deliverable completion */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Deliverable</span>
          </div>
          {withDeliverables.length === 0 ? (
            <p className="text-xs text-white/30 py-2">Belum ada deliverable aktif.</p>
          ) : (
            <div className="space-y-2.5">
              {withDeliverables.map((s) => {
                const pct = s.deliverableTotal > 0
                  ? Math.round((s.deliverableDone / s.deliverableTotal) * 100)
                  : 0;
                return (
                  <div key={s.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-white/80">{s.name}</span>
                      <span className="shrink-0 text-[11px] text-white/40">
                        {s.deliverableDone}/{s.deliverableTotal}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-400" : "bg-yellow-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming renewals */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Berakhir &lt;90 hari</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-xs text-white/30 py-2">Tidak ada sponsor yang segera berakhir.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((s) => {
                const d = daysUntil(s.end_date!);
                const urgent = d <= 30;
                return (
                  <div key={s.id} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${urgent ? "bg-red-500/8 border border-red-500/15" : "bg-white/4"}`}>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/85">{s.name}</p>
                      {s.deal_value && s.currency === "IDR" && (
                        <p className="text-[11px] text-white/40">{formatRupiah(s.deal_value)}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[11px] font-semibold ${urgent ? "text-red-400" : "text-orange-400"}`}>
                      {d}h
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Value by status */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Nilai per Status</span>
          </div>
          {totalIDR === 0 ? (
            <p className="text-xs text-white/30 py-2">Belum ada data nilai (IDR).</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(valueByStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, value]) => {
                  const pct = Math.round((value / totalIDR) * 100);
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${statusColor[status] ?? "bg-zinc-500"}`} />
                          <span className="text-xs text-white/70">{statusLabel[status] ?? status}</span>
                        </div>
                        <span className="text-[11px] text-white/40">{formatRupiah(value)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${statusColor[status] ?? "bg-zinc-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              <p className="pt-1 text-[11px] text-white/30">
                Total: {formatRupiah(totalIDR)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Efficiency score for active sponsors */}
      {withDeliverables.length > 0 && (() => {
        const totalDone = withDeliverables.reduce((s, sp) => s + sp.deliverableDone, 0);
        const totalAll = withDeliverables.reduce((s, sp) => s + sp.deliverableTotal, 0);
        const overall = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
        const color = overall >= 80 ? "text-green-400" : overall >= 50 ? "text-yellow-400" : "text-red-400";
        return (
          <div className="flex items-center gap-3 rounded-lg bg-white/4 px-4 py-3">
            <AlertTriangle className={`h-4 w-4 shrink-0 ${color}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/60">Completion Rate Keseluruhan</p>
              <p className={`text-sm font-semibold ${color}`}>
                {overall}% ({totalDone}/{totalAll} deliverable selesai)
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
