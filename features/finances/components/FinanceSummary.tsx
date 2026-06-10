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
      <div className="rounded-xl border border-ui-border bg-ui-surface p-6 transition-all hover:border-[#3D3D3D]">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ui-text-muted">Pemasukan</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-ui-text">
            {formatRupiah(summary.totalIncome)}
          </span>
          <ArrowUpRight className="h-4 w-4 text-green-500/50" />
        </div>
      </div>

      {/* Pengeluaran */}
      <div className="rounded-xl border border-ui-border bg-ui-surface p-6 transition-all hover:border-[#3D3D3D]">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ui-text-muted">Pengeluaran</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-ui-text">
            {formatRupiah(summary.totalExpense)}
          </span>
          <ArrowDownLeft className="h-4 w-4 text-red-500/50" />
        </div>
      </div>

      {/* Saldo (Total) */}
      <div className="rounded-xl border border-ui-text/10 bg-ui-text/5 p-6 transition-all hover:border-ui-text/20">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ui-text-2">Saldo Kas</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight ${summary.balance >= 0 ? "text-ui-text" : "text-red-400"}`}>
            {formatRupiah(summary.balance)}
          </span>
          <Wallet2 className="h-4 w-4 text-ui-text-2/50" />
        </div>
      </div>
    </div>
  );
};
export { FinanceSummaryCards };
