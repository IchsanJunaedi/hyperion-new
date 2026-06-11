import { TrendingUp, Users, DollarSign, Wallet, Shield, Target } from "lucide-react";
import type { ExecutiveSummary as ExecutiveSummaryType } from "@/features/dashboard/queries/executiveSummary";

function formatRupiah(n: number): string {
  if (Math.abs(n) >= 1_000_000_000)
    return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000_000)
    return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(n) >= 1_000)
    return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

function MetricCard({ icon, label, value, sub, accent }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-ui-border bg-ui-surface p-3 sm:p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex items-center gap-1.5 text-[10px] text-ui-text-muted font-semibold uppercase tracking-wider whitespace-nowrap">
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
        {label}
      </div>
      <div className="flex-1 flex items-center my-1">
        <p className={`text-lg sm:text-2xl font-bold tracking-tight whitespace-nowrap ${accent ?? "text-ui-text"}`}>
          {value}
        </p>
      </div>
      {sub && <p className="text-[10px] text-ui-text-muted whitespace-nowrap">{sub}</p>}
    </div>
  );
}

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
  orgName: string;
}

const ExecutiveSummary = ({ summary, orgName }: ExecutiveSummaryProps) => {
  const winRateColor =
    summary.winRate >= 60 ? "text-green-400" :
    summary.winRate >= 40 ? "text-yellow-400" : "text-red-400";

  const attendanceColor =
    summary.attendanceRate >= 70 ? "text-blue-400" :
    summary.attendanceRate >= 50 ? "text-yellow-400" : "text-red-400";

  const balanceColor = summary.netBalance >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ui-text">Executive Summary</h2>
        <span className="text-xs text-ui-text-muted">{orgName}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Win Rate"
          value={`${summary.winRate}%`}
          sub={`${summary.totalScrims} scrim selesai`}
          accent={winRateColor}
        />
        <MetricCard
          icon={<Target className="h-3.5 w-3.5" />}
          label="Attendance"
          value={`${summary.attendanceRate}%`}
          sub="Rata-rata kehadiran"
          accent={attendanceColor}
        />
        <MetricCard
          icon={<Users className="h-3.5 w-3.5" />}
          label="Member Aktif"
          value={String(summary.activeMemberCount)}
          sub="Di tim ini"
        />
        <MetricCard
          icon={<Shield className="h-3.5 w-3.5" />}
          label="Sponsor Aktif"
          value={String(summary.activeSponsors)}
          sub="Partner saat ini"
          accent={summary.activeSponsors > 0 ? "text-yellow-400" : undefined}
        />
        <MetricCard
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label="Nilai Sponsor"
          value={formatRupiah(summary.totalSponsorValue)}
          sub="Total deal aktif"
          accent={summary.totalSponsorValue > 0 ? "text-yellow-400" : undefined}
        />
        <MetricCard
          icon={<Wallet className="h-3.5 w-3.5" />}
          label="Saldo Kas"
          value={formatRupiah(summary.netBalance)}
          sub="Kumulatif semua waktu"
          accent={balanceColor}
        />
      </div>
    </div>
  );
};
export { ExecutiveSummary };
