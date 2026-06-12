"use client";

import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthPoint } from "@/features/dashboard/queries/homeCharts";

const WinRateAreaChart = ({ months }: { months: MonthPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={months} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="homeWinRateFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--ui-text)" }}
          itemStyle={{ color: "var(--ui-text-2)" }}
          formatter={(value, _name, item) => [
            `${value ?? 0}% (${(item?.payload as MonthPoint | undefined)?.scrimCount ?? 0} scrim)`,
            "Win Rate",
          ]}
        />
        <Area
          type="monotone"
          dataKey="winRate"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#homeWinRateFill)"
          dot={{ r: 2.5, fill: "#22c55e", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
export { WinRateAreaChart };
