import { TrendingDown, TrendingUp } from "lucide-react";
import type { FinanceRow } from "@/features/finances/queries";
import { FinanceDeleteButton } from "./FinanceDeleteButton";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const CAT_STYLE: Record<string, string> = {
  "Iuran Member": "bg-blue-500/10 text-blue-400",
  "Prize Money": "bg-yellow-500/10 text-yellow-400",
  "Sponsor": "bg-purple-500/10 text-purple-400",
  "Donasi": "bg-emerald-500/10 text-emerald-400",
  "Daftar Turnamen": "bg-orange-500/10 text-orange-400",
  "Jersey": "bg-pink-500/10 text-pink-400",
  "Bootcamp": "bg-indigo-500/10 text-indigo-400",
  "Peralatan": "bg-cyan-500/10 text-cyan-400",
  "Operasional": "bg-amber-500/10 text-amber-400",
};

interface FinanceTableProps {
  rows: FinanceRow[];
  orgId: string;
  canDelete: boolean;
  revalidatePaths: string[];
}

const FinanceTable = ({ rows, orgId, canDelete, revalidatePaths }: FinanceTableProps) => {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ui-border py-14 text-center">
        <p className="text-sm text-ui-text-muted">Belum ada transaksi bulan ini.</p>
        <p className="mt-1 text-xs text-ui-text-muted/60">Tambahkan transaksi pertama kamu.</p>
      </div>
    );
  }

  const cols = canDelete
    ? "grid-cols-[130px_150px_1fr_170px_40px]"
    : "grid-cols-[130px_150px_1fr_170px]";

  return (
    <div className="overflow-x-auto rounded-xl border border-ui-border">
    <div className="min-w-[580px]">
      {/* Header */}
      <div className={`grid ${cols} border-b border-ui-border bg-ui-surface px-5 py-3`}>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ui-text-muted">Tanggal</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ui-text-muted">Kategori</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ui-text-muted">Deskripsi</span>
        <span className="text-right text-[10px] font-semibold uppercase tracking-widest text-ui-text-muted">Jumlah</span>
        {canDelete && <span />}
      </div>

      {/* Rows */}
      <div className="divide-y divide-ui-border">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`grid ${cols} items-center px-5 py-3.5 transition-colors hover:bg-ui-surface/70`}
          >
            <span className="text-sm text-ui-text-2">
              {new Date(r.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span>
              <span
                className={`inline-block max-w-[130px] truncate rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  CAT_STYLE[r.category] ?? "bg-ui-border text-ui-text-2"
                }`}
              >
                {r.category}
              </span>
            </span>
            <span className="truncate pr-4 text-sm text-ui-text-2">{r.description ?? "—"}</span>
            <span
              className={`flex items-center justify-end gap-1.5 text-sm font-semibold tabular-nums ${
                r.type === "income" ? "text-green-400" : "text-red-400"
              }`}
            >
              {r.type === "income" ? (
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 shrink-0" />
              )}
              {formatRupiah(r.amount)}
            </span>
            {canDelete && (
              <div className="flex justify-end">
                <FinanceDeleteButton
                  financeId={r.id}
                  orgId={orgId}
                  description={r.description ?? r.category}
                  revalidatePaths={revalidatePaths}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};
export { FinanceTable };
