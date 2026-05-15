"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FinanceSummaryCards } from "./FinanceSummary";
import { FinanceTable } from "./FinanceTable";
import { FinanceForm } from "./FinanceForm";
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

export function FinancePageClient({
  orgId, rows, summary, year, month, canDelete, revalidatePaths,
}: FinancePageClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  function handleFilterChange(y: number, m: number) {
    const params = new URLSearchParams({ year: String(y), month: String(m) });
    router.push(`?${params.toString()}`);
  }

  const years = [year - 1, year, year + 1];

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E5E2E1]">Kas Tim</h1>
          <p className="mt-1 text-sm text-[#9B9A97]">Pencatatan keuangan organisasi.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white transition-colors"
        >
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={month}
          onChange={(e) => handleFilterChange(year, Number(e.target.value))}
          className="h-9 rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:outline-none"
        >
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={(e) => handleFilterChange(Number(e.target.value), month)}
          className="h-9 rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:outline-none"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <FinanceSummaryCards summary={summary} />
      <FinanceTable rows={rows} orgId={orgId} canDelete={canDelete} revalidatePaths={revalidatePaths} />

      {showForm && (
        <FinanceForm orgId={orgId} revalidatePaths={revalidatePaths} onClose={() => setShowForm(false)} />
      )}
    </>
  );
}
