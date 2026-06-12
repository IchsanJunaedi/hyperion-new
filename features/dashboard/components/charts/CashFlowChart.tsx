"use client";

import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthPoint } from "@/features/dashboard/queries/homeCharts";

function formatRpShort(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
  return String(v);
}

const LABELS: Record<string, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  cumulativeBalance: "Saldo",
};

const CashFlowChart = ({ months }: { months: MonthPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={months} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} tickFormatter={formatRpShort} />
        <Tooltip
          contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--ui-text)" }}
          itemStyle={{ color: "var(--ui-text-2)" }}
          formatter={(value, name) => [
            `Rp ${(Number(value) || 0).toLocaleString("id-ID")}`,
            LABELS[String(name)] ?? String(name),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "var(--ui-text-2)" }}
          formatter={(value) => LABELS[String(value)] ?? String(value)}
        />
        <Bar dataKey="income" fill="#22c55e" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" fill="#ef4444" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
        <Line type="monotone" dataKey="cumulativeBalance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
export { CashFlowChart };
