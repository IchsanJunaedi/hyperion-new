import { TrendingDown, TrendingUp } from "lucide-react";
import type { FinanceRow } from "@/features/finances/queries";
import { FinanceDeleteButton } from "./FinanceDeleteButton";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

interface FinanceTableProps {
  rows: FinanceRow[];
  orgId: string;
  canDelete: boolean;
  revalidatePaths: string[];
}

export function FinanceTable({ rows, orgId, canDelete, revalidatePaths }: FinanceTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#2D2D2D] p-8 text-center">
        <p className="text-sm text-[#9B9A97]">Belum ada transaksi bulan ini.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#2D2D2D]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2D2D2D] bg-[#202020]">
            <th className="px-4 py-3 text-left text-xs font-medium text-[#9B9A97]">Tanggal</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#9B9A97]">Kategori</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#9B9A97]">Deskripsi</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#9B9A97]">Jumlah</th>
            {canDelete && <th className="px-4 py-3 text-right text-xs font-medium text-[#9B9A97]" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2D2D2D]">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-[#202020] transition-colors">
              <td className="px-4 py-3 text-[#9B9A97] whitespace-nowrap">
                {new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="px-4 py-3 text-[#E5E2E1]">{r.category}</td>
              <td className="px-4 py-3 text-[#9B9A97]">{r.description ?? "—"}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <span className={`inline-flex items-center gap-1 font-medium ${r.type === "income" ? "text-green-400" : "text-red-400"}`}>
                  {r.type === "income"
                    ? <TrendingUp className="h-3.5 w-3.5" />
                    : <TrendingDown className="h-3.5 w-3.5" />}
                  {formatRupiah(r.amount)}
                </span>
              </td>
              {canDelete && (
                <td className="px-4 py-3 text-right">
                  <FinanceDeleteButton
                    financeId={r.id}
                    orgId={orgId}
                    description={r.description ?? r.category}
                    revalidatePaths={revalidatePaths}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
