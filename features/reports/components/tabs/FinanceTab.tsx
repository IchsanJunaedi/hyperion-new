import type { MonthlyReport } from "@/features/reports/queries";

function rp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export function FinanceTab({ finances }: { finances: NonNullable<MonthlyReport["finances"]> }) {
  const usagePercent = finances.totalIncome > 0
    ? Math.min(Math.round((finances.totalExpense / finances.totalIncome) * 100), 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Pemasukan</p>
          <p className="text-xl font-bold text-emerald-400">{rp(finances.totalIncome)}</p>
          <p className="text-xs text-[#9B9A97]">{finances.incomeList.length} transaksi</p>
        </div>
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Pengeluaran</p>
          <p className="text-xl font-bold text-rose-400">{rp(finances.totalExpense)}</p>
          <p className="text-xs text-[#9B9A97]">{finances.expenseList.length} transaksi</p>
        </div>
        <div className={`rounded-xl border p-4 space-y-1 ${
          finances.balance >= 0
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-rose-500/20 bg-rose-500/5"
        }`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Saldo</p>
          <p className={`text-xl font-bold ${finances.balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {finances.balance >= 0 ? "" : "-"}{rp(Math.abs(finances.balance))}
          </p>
          <p className={`text-xs font-medium ${finances.balance >= 0 ? "text-emerald-400/70" : "text-rose-400/70"}`}>
            {finances.balance >= 0 ? "Surplus" : "Defisit"}
          </p>
        </div>
      </div>

      {/* Usage bar */}
      {finances.totalIncome > 0 && (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9B9A97]">Penggunaan dari pemasukan</span>
            <span className={`font-bold ${usagePercent >= 80 ? "text-rose-400" : "text-emerald-400"}`}>
              {usagePercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#252525] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usagePercent >= 80 ? "bg-rose-500/60" : "bg-emerald-500/60"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Transaction tables */}
      <div className="grid gap-4 sm:grid-cols-2">
        {finances.incomeList.length > 0 && (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2D2D2D]">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Pemasukan</p>
            </div>
            <div className="divide-y divide-[#2D2D2D]">
              {finances.incomeList.map((f, i) => (
                <div key={i} className="px-4 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#E5E2E1] truncate">{f.description ?? f.category}</p>
                    <p className="text-[10px] text-[#6B6A68]">
                      {new Date(f.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 shrink-0">+{rp(f.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {finances.expenseList.length > 0 && (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2D2D2D]">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Pengeluaran</p>
            </div>
            <div className="divide-y divide-[#2D2D2D]">
              {finances.expenseList.map((f, i) => (
                <div key={i} className="px-4 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#E5E2E1] truncate">{f.description ?? f.category}</p>
                    <p className="text-[10px] text-[#6B6A68]">
                      {new Date(f.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-rose-400 shrink-0">-{rp(f.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {finances.incomeList.length === 0 && finances.expenseList.length === 0 && (
        <p className="text-sm text-[#6B6A68] text-center py-8">Tidak ada transaksi di bulan ini.</p>
      )}
    </div>
  );
}
