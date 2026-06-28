"use client";

import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthPoint } from "@/features/dashboard/queries/homeCharts";

interface TipProps {
  active?: boolean;
  payload?: Array<{ payload: MonthPoint }>;
}

const WinRateTooltip = ({ active, payload }: TipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  const m = payload[0]!.payload;
  const rows = (m.breakdown ?? []).filter((b) => b.scrimCount > 0);
  return (
    <div className="rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-ui-text">{m.monthLabel}</p>
      <p className="text-ui-text-2">
        Win Rate: {m.winRate}% ({m.scrimCount} scrim)
      </p>
      {rows.map((b) => (
        <p key={b.orgName} className="text-ui-text-muted">
          {b.orgName}: {b.winRate}% ({b.scrimCount})
        </p>
      ))}
    </div>
  );
};

const WinRateAreaChart = ({ months }: { months: MonthPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
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
        <Tooltip content={<WinRateTooltip />} />
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
