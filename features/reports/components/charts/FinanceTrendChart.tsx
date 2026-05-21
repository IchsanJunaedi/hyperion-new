"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { FinanceTrendPoint } from "@/features/reports/queries";

function formatRp(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

export function FinanceTrendChart({ data }: { data: FinanceTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#6B6A68" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6B6A68" }} axisLine={false} tickLine={false} tickFormatter={formatRp} />
        <Tooltip
          contentStyle={{ background: "#202020", border: "1px solid #2D2D2D", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#E5E2E1" }}
          formatter={(v, name) => [
            `Rp ${(Number(v) || 0).toLocaleString("id-ID")}`,
            name === "income" ? "Pemasukan" : "Pengeluaran",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#9B9A97" }}
          formatter={(v) => (v === "income" ? "Pemasukan" : "Pengeluaran")}
        />
        <Bar dataKey="income" fill="#22c55e" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" fill="#ef4444" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
