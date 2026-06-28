"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SponsorSlice } from "@/features/dashboard/queries/homeCharts";

const PALETTE = ["#eab308", "#3b82f6", "#22c55e", "#a855f7", "#9ca3af"];

const SponsorDonutChart = ({ sponsors }: { sponsors: SponsorSlice[] }) => {
  if (sponsors.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-ui-text-muted">
        Belum ada sponsor aktif
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
      <PieChart>
        <Pie
          data={sponsors}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={40}
          outerRadius={62}
          paddingAngle={2}
          strokeWidth={0}
          isAnimationActive={false}
        >
          {sponsors.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--ui-text)" }}
          itemStyle={{ color: "var(--ui-text-2)" }}
          formatter={(value, name) => [
            `Rp ${(Number(value) || 0).toLocaleString("id-ID")}`,
            String(name),
          ]}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 10, color: "var(--ui-text-2)", paddingTop: 4 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
export { SponsorDonutChart };
