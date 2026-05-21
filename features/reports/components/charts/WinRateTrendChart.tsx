"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { TrendPoint } from "@/features/reports/queries";

export function WinRateTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#6B6A68" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B6A68" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#202020", border: "1px solid #2D2D2D", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#E5E2E1" }}
          formatter={(v) => [`${v ?? 0}%`, "Win Rate"]}
        />
        <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.winRate >= 50 ? "#22c55e" : "#ef4444"} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
