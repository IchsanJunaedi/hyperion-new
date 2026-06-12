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

function fmtRp(v: number): string {
  return `Rp ${v.toLocaleString("id-ID")}`;
}

interface TipProps {
  active?: boolean;
  payload?: Array<{ payload: MonthPoint }>;
}

const CashFlowTooltip = ({ active, payload }: TipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  const m = payload[0]!.payload;
  const rows = (m.breakdown ?? []).filter((b) => b.income !== 0 || b.expense !== 0);
  return (
    <div className="rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-ui-text">{m.monthLabel}</p>
      <p className="text-green-500">Pemasukan: {fmtRp(m.income)}</p>
      <p className="text-red-500">Pengeluaran: {fmtRp(m.expense)}</p>
      <p className="text-blue-500">Saldo: {fmtRp(m.cumulativeBalance)}</p>
      {rows.map((b) => (
        <p key={b.orgName} className="text-ui-text-muted">
          {b.orgName}: +{fmtRp(b.income)} / −{fmtRp(b.expense)}
        </p>
      ))}
    </div>
  );
};

const CashFlowChart = ({ months }: { months: MonthPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={months} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} tickFormatter={formatRpShort} />
        <Tooltip content={<CashFlowTooltip />} />
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
