"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FinanceSummaryCards } from "./FinanceSummary";
import { FinanceTable } from "./FinanceTable";
import { FinanceForm } from "./FinanceForm";
import { FinanceChart } from "./FinanceChart";
import type { FinanceRow, FinanceSummary } from "@/features/finances/queries";

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

interface FinancePageClientProps {
  orgId: string;
  rows: FinanceRow[];
  summary: FinanceSummary;
  year: number;
  month: number;
  canDelete: boolean;
  revalidatePaths: string[];
}

const FinancePageClient = ({
  orgId,
  rows,
  summary,
  year,
  month,
  canDelete,
  revalidatePaths,
}: FinancePageClientProps) => {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  function navigate(y: number, m: number) {
    router.push(`?${new URLSearchParams({ year: String(y), month: String(m) })}`);
  }

  function prevMonth() {
    if (month === 1) navigate(year - 1, 12);
    else navigate(year, month - 1);
  }

  function nextMonth() {
    if (month === 12) navigate(year + 1, 1);
    else navigate(year, month + 1);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E5E2E1]">Kas Tim</h1>
          <p className="mt-1 text-sm text-[#9B9A97]">Pencatatan keuangan organisasi.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] transition-colors hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          Tambah
        </button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#2D2D2D] bg-[#202020]">
          <button
            type="button"
            onClick={prevMonth}
            className="cursor-pointer p-2.5 text-[#9B9A97] transition-colors hover:bg-[#2C2C2C] hover:text-[#E5E2E1]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[148px] px-3 py-2 text-center text-sm font-medium text-[#E5E2E1]">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="cursor-pointer p-2.5 text-[#9B9A97] transition-colors hover:bg-[#2C2C2C] hover:text-[#E5E2E1]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <FinanceSummaryCards summary={summary} />

      {/* Chart — only shown when there is data */}
      {rows.length > 0 && <FinanceChart rows={rows} summary={summary} />}

      {/* Transaction list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B6A68]">
            Riwayat Transaksi
          </h2>
          <span className="text-xs text-[#6B6A68]">{rows.length} transaksi</span>
        </div>
        <FinanceTable
          rows={rows}
          orgId={orgId}
          canDelete={canDelete}
          revalidatePaths={revalidatePaths}
        />
      </div>

      {showForm && (
        <FinanceForm
          orgId={orgId}
          revalidatePaths={revalidatePaths}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
};
export { FinancePageClient };
