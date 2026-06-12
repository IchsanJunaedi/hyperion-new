"use client";

import type { HomeChartData } from "@/features/dashboard/queries/homeCharts";
import { ChartCard } from "./ChartCard";
import { WinRateAreaChart } from "./WinRateAreaChart";
import { CashFlowChart } from "./CashFlowChart";
import { AttendanceLineChart } from "./AttendanceLineChart";
import { SponsorDonutChart } from "./SponsorDonutChart";

const HomeCharts = ({ data }: { data: HomeChartData }) => {
  const scrimEmpty = data.months.every((m) => m.scrimCount === 0);
  const attendanceEmpty = data.months.every((m) => m.attendanceRate === 0);
  const financeEmpty = data.months.every(
    (m) => m.income === 0 && m.expense === 0 && m.cumulativeBalance === 0,
  );
  const totalSponsor = data.sponsors.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <ChartCard title="Win Rate Trend" subtitle="6 bulan terakhir" isEmpty={scrimEmpty}>
        <WinRateAreaChart months={data.months} />
      </ChartCard>
      <ChartCard title="Cash Flow" subtitle="Pemasukan vs pengeluaran + saldo berjalan" isEmpty={financeEmpty}>
        <CashFlowChart months={data.months} />
      </ChartCard>
      <ChartCard title="Attendance Trend" subtitle="Rata-rata kehadiran scrim per bulan" isEmpty={attendanceEmpty}>
        <AttendanceLineChart months={data.months} />
      </ChartCard>
      <ChartCard
        title="Sponsor Portfolio"
        subtitle={totalSponsor > 0 ? `Total Rp ${totalSponsor.toLocaleString("id-ID")}` : "Deal aktif per sponsor"}
      >
        <SponsorDonutChart sponsors={data.sponsors} />
      </ChartCard>
    </div>
  );
};
export { HomeCharts };
