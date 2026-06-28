"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityPoint } from "@/features/dashboard/actions/fetchAuditActivity";

interface AuditActivityChartProps {
  data7: ActivityPoint[];
  data30: ActivityPoint[];
}

const AuditActivityChart = ({ data7, data30 }: AuditActivityChartProps) => {
  const [range, setRange] = useState<7 | 30>(7);
  const data = range === 7 ? data7 : data30;

  const formatDay = (day: string) => {
    const parts = day.split("/");
    if (parts.length < 2) return day;
    return `${parts[0]}/${parts[1]}`;
  };

  return (
    <div className="rounded-lg border border-ui-border bg-ui-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ui-text">Aktivitas</h2>
        <div className="flex items-center gap-1">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1 rounded text-xs cursor-pointer transition-colors ${
                range === d
                  ? "bg-ui-hover text-ui-text"
                  : "text-ui-text-muted hover:text-ui-text-2"
              }`}
            >
              {d} Hari
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120} minWidth={0} minHeight={0}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tickFormatter={formatDay}
            tick={{ fontSize: 10, fill: "#6B6A68" }}
            tickLine={false}
            axisLine={false}
            interval={range === 7 ? 0 : 4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6B6A68" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#202020",
              border: "1px solid #2D2D2D",
              borderRadius: 6,
              fontSize: 12,
              color: "#E5E2E1",
            }}
            formatter={
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((value: number) => [value, "Aktivitas"]) as any
            }
            labelFormatter={(label) => `Tanggal: ${label}`}
          />
          <Bar dataKey="count" fill="#4B5563" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
export { AuditActivityChart };
