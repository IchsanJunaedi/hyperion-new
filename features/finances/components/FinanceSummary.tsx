import { ArrowDownLeft, ArrowUpRight, Wallet2 } from "lucide-react";
import type { FinanceSummary } from "@/features/finances/queries";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FinanceSummaryCards({ summary }: { summary: FinanceSummary }) {
  const isPositive = summary.balance >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex items-start gap-4 rounded-xl border border-[#2D2D2D] bg-[#202020] p-5">
        <div className="shrink-0 rounded-lg bg-green-500/10 p-2.5">
          <ArrowUpRight className="h-4 w-4 text-green-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-[#6B6A68]">Total Masuk</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-green-400">
            {formatRupiah(summary.totalIncome)}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4 rounded-xl border border-[#2D2D2D] bg-[#202020] p-5">
        <div className="shrink-0 rounded-lg bg-red-500/10 p-2.5">
          <ArrowDownLeft className="h-4 w-4 text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-[#6B6A68]">Total Keluar</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-red-400">
            {formatRupiah(summary.totalExpense)}
          </p>
        </div>
      </div>

      <div
        className={`flex items-start gap-4 rounded-xl border p-5 ${
          isPositive ? "border-[#2D2D2D] bg-[#202020]" : "border-red-500/20 bg-red-500/5"
        }`}
      >
        <div
          className={`shrink-0 rounded-lg p-2.5 ${
            isPositive ? "bg-[#2D2D2D]" : "bg-red-500/10"
          }`}
        >
          <Wallet2 className={`h-4 w-4 ${isPositive ? "text-[#9B9A97]" : "text-red-400"}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-[#6B6A68]">Saldo</p>
          <p
            className={`mt-1.5 text-xl font-bold tabular-nums ${
              isPositive ? "text-[#E5E2E1]" : "text-red-400"
            }`}
          >
            {formatRupiah(summary.balance)}
          </p>
          <p className={`mt-0.5 text-[10px] ${isPositive ? "text-[#6B6A68]" : "text-red-400/60"}`}>
            {isPositive ? "Surplus" : "Defisit"}
          </p>
        </div>
      </div>
    </div>
  );
}
