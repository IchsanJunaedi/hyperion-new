"use client";

import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthPoint } from "@/features/dashboard/queries/homeCharts";

const AttendanceLineChart = ({ months }: { months: MonthPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={months} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--ui-text)" }}
          itemStyle={{ color: "var(--ui-text-2)" }}
          formatter={(value) => [`${value ?? 0}%`, "Kehadiran"]}
        />
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
