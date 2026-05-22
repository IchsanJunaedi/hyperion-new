import { Trophy, Users, Calendar, Handshake } from "lucide-react";
import { WinRateTrendChart } from "@/features/reports/components/charts/WinRateTrendChart";
import { FinanceTrendChart } from "@/features/reports/components/charts/FinanceTrendChart";
import type { MonthlyReport } from "@/features/reports/queries";

function StatCard({ label, value, sub, color = "default" }: {
  label: string; value: string; sub: string;
  color?: "green" | "red" | "blue" | "yellow" | "default";
}) {
  const valueClass = {
    green: "text-emerald-400", red: "text-rose-400", blue: "text-blue-400",
    yellow: "text-yellow-400", default: "text-[#E5E2E1]",
  }[color];
  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-[#9B9A97]">{sub}</p>
    </div>
  );
}

export function OverviewTab({ report }: { report: MonthlyReport }) {
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
      <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
          Tren Win Rate Scrim (6 Bulan)
        </p>
        <WinRateTrendChart data={trend.scrimWinRate} />
      </div>

      {/* Row 3 — Finance/attendance trend + activity */}
      <div className="grid gap-4 sm:grid-cols-2">
        {trend.finance ? (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
              Tren Keuangan (6 Bulan)
            </p>
            <FinanceTrendChart data={trend.finance} />
          </div>
        ) : (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
              Tren Kehadiran (6 Bulan)
            </p>
            <div className="space-y-2 pt-1">
              {trend.attendance.map((p) => (
                <div key={p.monthLabel} className="flex items-center gap-3">
                  <span className="w-12 text-[11px] text-[#6B6A68]">{p.monthLabel}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#252525] overflow-hidden">
                    <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${p.avgRate}%` }} />
                  </div>
                  <span className="w-9 text-right text-[11px] text-[#9B9A97]">{p.avgRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
            Aktivitas Bulan Ini
          </p>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-3 text-sm">
              <Trophy className="h-4 w-4 text-[#6B6A68] shrink-0" />
              <span className="text-[#9B9A97]">Scrim dijadwalkan</span>
              <span className="ml-auto font-semibold text-[#E5E2E1]">{activity.scrimsScheduled}</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-[#6B6A68] shrink-0" />
              <span className="text-[#9B9A97]">Turnamen aktif</span>
              <span className="ml-auto font-semibold text-[#E5E2E1]">{activity.tournamentsActive}</span>
            </li>
            {activity.sponsorsActive !== null && (
              <li className="flex items-center gap-3 text-sm">
                <Handshake className="h-4 w-4 text-[#6B6A68] shrink-0" />
                <span className="text-[#9B9A97]">Sponsor aktif</span>
                <span className="ml-auto font-semibold text-[#E5E2E1]">{activity.sponsorsActive}</span>
              </li>
            )}
            <li className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-[#6B6A68] shrink-0" />
              <span className="text-[#9B9A97]">Member aktif</span>
              <span className="ml-auto font-semibold text-[#E5E2E1]">{activity.membersActive}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
