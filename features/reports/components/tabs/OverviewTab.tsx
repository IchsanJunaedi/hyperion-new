"use client";

import { Trophy, Users, Calendar, Handshake } from "lucide-react";
import dynamic from "next/dynamic";
import type { MonthlyReport } from "@/features/reports/queries";

const chartFallback = <div className="h-[200px] w-full animate-pulse rounded bg-ui-border/30" />;

const WinRateTrendChart = dynamic(
  () => import("@/features/reports/components/charts/WinRateTrendChart").then((m) => m.WinRateTrendChart),
  { ssr: false, loading: () => chartFallback }
);
const FinanceTrendChart = dynamic(
  () => import("@/features/reports/components/charts/FinanceTrendChart").then((m) => m.FinanceTrendChart),
  { ssr: false, loading: () => chartFallback }
);

function StatCard({ label, value, sub, color = "default" }: {
  label: string; value: string; sub: string;
  color?: "green" | "red" | "blue" | "yellow" | "default";
}) {
  const valueClass = {
    green: "text-emerald-400", red: "text-rose-400", blue: "text-blue-400",
    yellow: "text-yellow-400", default: "text-ui-text",
  }[color];
  return (
    <div className="rounded-xl border border-ui-border bg-ui-surface p-4 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-ui-text-2">{sub}</p>
    </div>
  );
}

const OverviewTab = ({ report }: { report: MonthlyReport }) => {
  const { scrims, tournaments, attendance, finances, trend, activity } = report;

  return (
    <div className="space-y-6">
      {/* Row 1 — 4 stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Scrim Win Rate"
          value={`${scrims.winRate}%`}
          sub={`${scrims.wins}W · ${scrims.losses}L · ${scrims.draws}D`}
          color={scrims.winRate >= 50 ? "green" : "red"}
        />
        <StatCard
          label="Turnamen"
          value={String(tournaments.total)}
          sub={`${tournaments.ongoing} berjalan · ${tournaments.completed} selesai`}
          color="yellow"
        />
        <StatCard
          label="Kehadiran"
          value={`${attendance.avgAttendanceRate}%`}
          sub="rata-rata kehadiran scrim"
          color="blue"
        />
        {finances ? (
          <StatCard
            label="Saldo Kas"
            value={`Rp ${Math.abs(finances.balance).toLocaleString("id-ID")}`}
            sub={finances.balance >= 0 ? "surplus" : "defisit"}
            color={finances.balance >= 0 ? "green" : "red"}
          />
        ) : (
          <StatCard
            label="Member Aktif"
            value={String(attendance.totalMembers)}
            sub="anggota terdaftar"
          />
        )}
      </div>

      {/* Row 2 — Win rate trend */}
      <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">
          Tren Win Rate Scrim (6 Bulan)
        </p>
        <WinRateTrendChart data={trend.scrimWinRate} />
      </div>

      {/* Row 3 — Finance/attendance trend + activity */}
      <div className="grid gap-4 sm:grid-cols-2">
        {trend.finance ? (
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">
              Tren Keuangan (6 Bulan)
            </p>
            <FinanceTrendChart data={trend.finance} />
          </div>
        ) : (
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">
              Tren Kehadiran (6 Bulan)
            </p>
            <div className="space-y-2 pt-1">
              {trend.attendance.map((p) => (
                <div key={p.monthLabel} className="flex items-center gap-3">
                  <span className="w-12 text-[11px] text-ui-text-muted">{p.monthLabel}</span>
                  <div className="flex-1 h-2 rounded-full bg-ui-elevated overflow-hidden">
                    <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${p.avgRate}%` }} />
                  </div>
                  <span className="w-9 text-right text-[11px] text-ui-text-2">{p.avgRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">
            Aktivitas Bulan Ini
          </p>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-3 text-sm">
              <Trophy className="h-4 w-4 text-ui-text-muted shrink-0" />
              <span className="text-ui-text-2">Scrim dijadwalkan</span>
              <span className="ml-auto font-semibold text-ui-text">{activity.scrimsScheduled}</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-ui-text-muted shrink-0" />
              <span className="text-ui-text-2">Turnamen aktif</span>
              <span className="ml-auto font-semibold text-ui-text">{activity.tournamentsActive}</span>
            </li>
            {activity.sponsorsActive !== null && (
              <li className="flex items-center gap-3 text-sm">
                <Handshake className="h-4 w-4 text-ui-text-muted shrink-0" />
                <span className="text-ui-text-2">Sponsor aktif</span>
                <span className="ml-auto font-semibold text-ui-text">{activity.sponsorsActive}</span>
              </li>
            )}
            <li className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-ui-text-muted shrink-0" />
              <span className="text-ui-text-2">Member aktif</span>
              <span className="ml-auto font-semibold text-ui-text">{activity.membersActive}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export { OverviewTab };
