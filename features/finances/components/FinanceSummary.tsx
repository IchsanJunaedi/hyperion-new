import type { FinanceSummary } from "@/features/finances/queries";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export function FinanceSummaryCards({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <p className="text-xs text-green-400/70">Total Masuk</p>
        <p className="mt-1 text-xl font-bold text-green-400">{formatRupiah(summary.totalIncome)}</p>
      </div>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-xs text-red-400/70">Total Keluar</p>
        <p className="mt-1 text-xl font-bold text-red-400">{formatRupiah(summary.totalExpense)}</p>
      </div>
      <div className={`rounded-lg border p-4 ${summary.balance >= 0 ? "border-[#2D2D2D] bg-[#202020]" : "border-red-500/20 bg-red-500/5"}`}>
        <p className="text-xs text-[#9B9A97]">Saldo</p>
        <p className={`mt-1 text-xl font-bold ${summary.balance >= 0 ? "text-[#E5E2E1]" : "text-red-400"}`}>
          {formatRupiah(summary.balance)}
        </p>
      </div>
    </div>
  );
}
