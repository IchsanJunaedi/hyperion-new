"use client";

import type { FinanceRow, FinanceSummary } from "@/features/finances/queries";

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return `${n}`;
}

function fmtFull(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

interface FinanceChartProps {
  rows: FinanceRow[];
  summary: FinanceSummary;
}

export function FinanceChart({ rows, summary }: FinanceChartProps) {
  const total = summary.totalIncome + summary.totalExpense;
  const incomeW = total > 0 ? (summary.totalIncome / total) * 100 : 0;
  const expenseW = total > 0 ? (summary.totalExpense / total) * 100 : 0;

  const expenseByCat: Record<string, number> = {};
  const incomeByCat: Record<string, number> = {};
  for (const r of rows) {
    if (r.type === "expense") expenseByCat[r.category] = (expenseByCat[r.category] ?? 0) + r.amount;
    else incomeByCat[r.category] = (incomeByCat[r.category] ?? 0) + r.amount;
  }

  const topExpense = Object.entries(expenseByCat)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const topIncome = Object.entries(incomeByCat)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const maxCat = Math.max(...topExpense.map(([, v]) => v), 1);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
      {/* Income vs Expense */}
      <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-5 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6A68]">Ringkasan Bulan Ini</p>

        {/* Stacked bar */}
        <div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#2D2D2D]">
            <div
              className="h-full bg-green-500 transition-all duration-700"
              style={{ width: `${incomeW}%` }}
            />
            <div
              className="h-full bg-red-500 transition-all duration-700"
              style={{ width: `${expenseW}%` }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-[11px] text-[#9B9A97]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Masuk {incomeW.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              Keluar {expenseW.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-green-500/8 border border-green-500/15 px-4 py-3">
            <p className="text-[10px] text-green-400/70 uppercase tracking-wider">Pemasukan</p>
            <p className="mt-1 text-base font-bold text-green-400">{fmt(summary.totalIncome)}</p>
            <p className="text-[10px] text-green-400/50">{fmtFull(summary.totalIncome)}</p>
          </div>
          <div className="rounded-lg bg-red-500/8 border border-red-500/15 px-4 py-3">
            <p className="text-[10px] text-red-400/70 uppercase tracking-wider">Pengeluaran</p>
            <p className="mt-1 text-base font-bold text-red-400">{fmt(summary.totalExpense)}</p>
            <p className="text-[10px] text-red-400/50">{fmtFull(summary.totalExpense)}</p>
          </div>
        </div>

        {/* Top income */}
        {topIncome.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[#6B6A68]">Sumber Pemasukan</p>
            {topIncome.map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-[#9B9A97]">{cat}</span>
                <span className="font-medium text-green-400">{fmt(amt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6A68]">Rincian Pengeluaran</p>

        {topExpense.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-[#6B6A68]">Tidak ada pengeluaran</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {topExpense.map(([cat, amt], i) => {
              const pct = (amt / maxCat) * 100;
              const rank = i + 1;
              return (
                <div key={cat}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold text-[#6B6A68] bg-[#2D2D2D]">
                        {rank}
                      </span>
                      <span className="text-sm text-[#E5E2E1]">{cat}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-red-400">{fmt(amt)}</span>
                      <span className="ml-2 text-[10px] text-[#6B6A68]">{((amt / (summary.totalExpense || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2D2D2D]">
                    <div
                      className="h-full rounded-full bg-red-500/50 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Transaction count */}
        <div className="mt-4 border-t border-[#2D2D2D] pt-4 flex items-center justify-between text-[11px] text-[#6B6A68]">
          <span>Total transaksi</span>
          <span className="font-medium text-[#9B9A97]">{rows.length} transaksi</span>
        </div>
      </div>
    </div>
  );
}
