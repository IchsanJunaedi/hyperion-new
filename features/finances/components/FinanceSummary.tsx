import { ArrowDownLeft, ArrowUpRight, Wallet2 } from "lucide-react";
import type { FinanceSummary } from "@/features/finances/queries";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const FinanceSummaryCards = ({ summary }: { summary: FinanceSummary }) => {
  const isPositive = summary.balance >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Pemasukan */}
      <div className="rounded-xl border border-[#2D2D2D] bg-[#1E1E1E] p-6 transition-all hover:border-[#3D3D3D]">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6B6A68]">Pemasukan</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#E5E2E1]">
            {formatRupiah(summary.totalIncome)}
          </span>
          <ArrowUpRight className="h-4 w-4 text-green-500/50" />
        </div>
      </div>

      {/* Pengeluaran */}
      <div className="rounded-xl border border-[#2D2D2D] bg-[#1E1E1E] p-6 transition-all hover:border-[#3D3D3D]">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6B6A68]">Pengeluaran</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#E5E2E1]">
            {formatRupiah(summary.totalExpense)}
          </span>
          <ArrowDownLeft className="h-4 w-4 text-red-500/50" />
        </div>
      </div>

      {/* Saldo (Total) */}
      <div className="rounded-xl border border-[#E5E2E1]/10 bg-[#E5E2E1]/5 p-6 transition-all hover:border-[#E5E2E1]/20">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9B9A97]">Saldo Kas</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight ${summary.balance >= 0 ? "text-white" : "text-red-400"}`}>
            {formatRupiah(summary.balance)}
          </span>
          <Wallet2 className="h-4 w-4 text-[#9B9A97]/50" />
        </div>
      </div>
    </div>
  );
};
export { FinanceSummaryCards };
