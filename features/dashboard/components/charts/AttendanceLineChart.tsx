"use client";

import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthPoint } from "@/features/dashboard/queries/homeCharts";

interface TipProps {
  active?: boolean;
  payload?: Array<{ payload: MonthPoint }>;
}

const AttendanceTooltip = ({ active, payload }: TipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  const m = payload[0]!.payload;
  const rows = (m.breakdown ?? []).filter((b) => b.scrimCount > 0);
  return (
    <div className="rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-ui-text">{m.monthLabel}</p>
      <p className="text-ui-text-2">Kehadiran: {m.attendanceRate}%</p>
      {rows.map((b) => (
        <p key={b.orgName} className="text-ui-text-muted">
          {b.orgName}: {b.attendanceRate}%
        </p>
      ))}
    </div>
  );
};

const AttendanceLineChart = ({ months }: { months: MonthPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={months} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<AttendanceTooltip />} />
        <Line
          type="monotone"
          dataKey="attendanceRate"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "#3b82f6", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
export { AttendanceLineChart };
