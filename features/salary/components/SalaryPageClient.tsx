"use client";

import { AlertTriangle, Plus, Users, Wallet } from "lucide-react";
import { useState } from "react";

import { SalaryCard } from "@/features/salary/components/SalaryCard";
import { SalaryFormModal } from "@/features/salary/components/SalaryFormModal";
import type { ContractWithProfile, PayrollSummary } from "@/features/salary/queries";

interface Member {
  user_id: string;
  display_name: string | null;
  role: string | null;
}

interface SalaryPageClientProps {
  orgId: string;
  contracts: ContractWithProfile[];
  summary: PayrollSummary;
  members: Member[];
  revalidatePaths: string[];
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function SalaryPageClient({
  orgId,
  contracts,
  summary,
  members,
  revalidatePaths,
}: SalaryPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContractWithProfile | undefined>(undefined);

  function openCreate() {
    setEditTarget(undefined);
    setModalOpen(true);
  }

  function openEdit(contract: ContractWithProfile) {
    setEditTarget(contract);
    setModalOpen(true);
  }

  const active = contracts.filter((c) => c.status === "active");
  const inactive = contracts.filter((c) => c.status !== "active");

  return (
    <>
      {/* Summary header */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
          <div className="flex items-center gap-2 text-[#6B6A68]">
            <Wallet className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Total Payroll / Bulan</span>
          </div>
          <p className="mt-2 text-xl font-bold text-[#E5E2E1]">
            {formatRupiah(summary.totalMonthlyPayroll)}
          </p>
        </div>

        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
          <div className="flex items-center gap-2 text-[#6B6A68]">
            <Users className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Kontrak Aktif</span>
          </div>
          <p className="mt-2 text-xl font-bold text-[#E5E2E1]">{summary.activeCount} player</p>
        </div>

        <div className={`rounded-xl border p-4 ${summary.expiringCount > 0 ? "border-orange-500/40 bg-orange-500/5" : "border-[#2D2D2D] bg-[#202020]"}`}>
          <div className="flex items-center gap-2 text-[#6B6A68]">
            <AlertTriangle className={`h-4 w-4 ${summary.expiringCount > 0 ? "text-orange-400" : ""}`} />
            <span className="text-xs uppercase tracking-wide">Expire dalam 30 Hari</span>
          </div>
          <p className={`mt-2 text-xl font-bold ${summary.expiringCount > 0 ? "text-orange-400" : "text-[#E5E2E1]"}`}>
            {summary.expiringCount} kontrak
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#9B9A97] uppercase tracking-wide">
          Kontrak Aktif ({active.length})
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tambah Kontrak
        </button>
      </div>

      {active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2D2D2D] bg-[#202020]/40 p-10 text-center">
          <Wallet className="mx-auto h-8 w-8 text-[#6B6A68]" />
          <p className="mt-3 text-sm text-[#9B9A97]">Belum ada kontrak aktif.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/5 cursor-pointer"
          >
            Tambah kontrak pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((c) => (
            <SalaryCard
              key={c.id}
              contract={c}
              orgId={orgId}
              revalidatePaths={revalidatePaths}

              onEdit={() => openEdit(c)}
            />
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-[#6B6A68] uppercase tracking-wide">
            Tidak Aktif ({inactive.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 opacity-60">
            {inactive.map((c) => (
              <SalaryCard
                key={c.id}
                contract={c}
                orgId={orgId}
                revalidatePaths={revalidatePaths}
  
                onEdit={() => openEdit(c)}
              />
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <SalaryFormModal
          orgId={orgId}
          members={members}
          contract={editTarget}
          revalidatePaths={revalidatePaths}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
