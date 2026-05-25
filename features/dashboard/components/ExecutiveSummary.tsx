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
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs text-[#6B6A68] font-medium uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accent ?? "text-[#E5E2E1]"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#6B6A68]">{sub}</p>}
    </div>
  );
}

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
  orgName: string;
}

export function ExecutiveSummary({ summary, orgName }: ExecutiveSummaryProps) {
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
        <h2 className="text-base font-semibold text-[#E5E2E1]">Executive Summary</h2>
        <span className="text-xs text-[#6B6A68]">{orgName}</span>
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
}
