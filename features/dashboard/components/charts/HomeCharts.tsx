"use client";

import dynamic from "next/dynamic";

import type { HomeChartData } from "@/features/dashboard/queries/homeCharts";
import { ChartCard } from "./ChartCard";

const chartFallback = <div className="h-[200px] w-full animate-pulse rounded bg-ui-border/30" />;

const WinRateAreaChart = dynamic(
  () => import("./WinRateAreaChart").then((m) => m.WinRateAreaChart),
  { ssr: false, loading: () => chartFallback }
);
const CashFlowChart = dynamic(
  () => import("./CashFlowChart").then((m) => m.CashFlowChart),
  { ssr: false, loading: () => chartFallback }
);
const AttendanceLineChart = dynamic(
  () => import("./AttendanceLineChart").then((m) => m.AttendanceLineChart),
  { ssr: false, loading: () => chartFallback }
);
const SponsorDonutChart = dynamic(
  () => import("./SponsorDonutChart").then((m) => m.SponsorDonutChart),
  { ssr: false, loading: () => chartFallback }
);

const HomeCharts = ({ data }: { data: HomeChartData }) => {
  const scrimEmpty = data.months.every((m) => m.scrimCount === 0);
  const attendanceEmpty = data.months.every((m) => m.attendanceRate === 0);
  const financeEmpty = data.months.every(
    (m) => m.income === 0 && m.expense === 0 && m.cumulativeBalance === 0,
  );
  const totalSponsor = data.sponsors.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Baris 1: Cash Flow (2/3) + Sponsor Portfolio (1/3) */}
      <div className="lg:col-span-2">
        <ChartCard title="Cash Flow" subtitle="Pemasukan vs pengeluaran + saldo berjalan" isEmpty={financeEmpty}>
          <CashFlowChart months={data.months} />
        </ChartCard>
      </div>
      <div className="lg:col-span-1">
        <ChartCard
          title="Sponsor Portfolio"
          subtitle={totalSponsor > 0 ? `Total Rp ${totalSponsor.toLocaleString("id-ID")}` : "Deal aktif per sponsor"}
        >
          <SponsorDonutChart sponsors={data.sponsors} />
        </ChartCard>
      </div>

      {/* Baris 2: Win Rate Trend (1/3) + Attendance Trend (2/3) */}
      <div className="lg:col-span-1">
        <ChartCard title="Win Rate Trend" subtitle="6 bulan terakhir" isEmpty={scrimEmpty}>
          <WinRateAreaChart months={data.months} />
        </ChartCard>
      </div>
      <div className="lg:col-span-2">
        <ChartCard title="Attendance Trend" subtitle="Rata-rata kehadiran scrim per bulan" isEmpty={attendanceEmpty}>
          <AttendanceLineChart months={data.months} />
        </ChartCard>
      </div>
    </div>
  );
};
export { HomeCharts };
