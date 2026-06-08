"use client";

import { AlertTriangle, CheckCircle2, CircleDashed, Plus, Users, Wallet, Search } from "lucide-react";
import { useState } from "react";

import { SalaryCard } from "@/features/salary/components/SalaryCard";
import { SalaryFormModal } from "@/features/salary/components/SalaryFormModal";
import type { ContractWithProfile, PayrollSummary } from "@/features/salary/queries";
import type { MonthlySpend } from "@/features/salary/logic";
import { CustomSelect } from "@/features/dashboard/components/CustomSelect";

interface Member {
  user_id: string;
  display_name: string | null;
  role: string | null;
  organization_id?: string;
  org_name?: string | null;
}

interface SalaryPageClientProps {
  orgs: Array<{ id: string; name: string }>;
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

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return String(n);
}

function SpendChart({ data }: { data: MonthlySpend[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
      <div className="flex items-center gap-2 text-[#6B6A68]">
        <Wallet className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">Pengeluaran Gaji 6 Bulan</span>
      </div>
      {hasData ? (
        <div className="mt-3 flex h-24 items-end justify-between gap-2">
          {data.map((d) => (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[9px] text-[#6B6A68]">
                {d.total > 0 ? formatCompact(d.total) : ""}
              </span>
              <div
                className="w-full rounded-t bg-emerald-500/60"
                style={{ height: `${Math.max(2, (d.total / max) * 72)}px` }}
                title={formatRupiah(d.total)}
              />
              <span className="text-[10px] text-[#9B9A97]">{d.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-center text-xs text-[#6B6A68]">
          Belum ada pembayaran tercatat.
        </p>
      )}
    </div>
  );
}

const SalaryPageClient = ({
  orgs,
  contracts,
  summary,
  members,
  revalidatePaths,
}: SalaryPageClientProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContractWithProfile | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState("all");

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

  const filteredActive = active.filter((c) => {
    const matchesSearch = searchQuery
      ? c.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesOrg =
      selectedOrgFilter === "all" ? true : c.organization_id === selectedOrgFilter;
    return matchesSearch && matchesOrg;
  });

  // Group active contracts by organization name
  const groupedActive: Record<string, ContractWithProfile[]> = {};
  for (const c of filteredActive) {
    const orgName = c.org_name ?? "Tim Tidak Dikenal";
    if (!groupedActive[orgName]) {
      groupedActive[orgName] = [];
    }
    groupedActive[orgName].push(c);
  }

  const sortedGroupNames = Object.keys(groupedActive).sort((a, b) => {
    if (a === "Tim Tidak Dikenal") return 1;
    if (b === "Tim Tidak Dikenal") return -1;
    return a.localeCompare(b);
  });

  const filterOptions = [
    { value: "all", label: "Semua Tim" },
    ...orgs.map((o) => ({ value: o.id, label: o.name })),
  ];

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

      {/* Cashflow overview: paid this month, outstanding, 6-month spend chart */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_2fr]">
        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
          <div className="flex items-center gap-2 text-[#6B6A68]">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs uppercase tracking-wide">Dibayar Bulan Ini</span>
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-400">
            {formatRupiah(summary.paidThisMonth)}
          </p>
        </div>

        <div className={`rounded-xl border p-4 ${summary.outstandingThisMonth > 0 ? "border-rose-500/40 bg-rose-500/5" : "border-[#2D2D2D] bg-[#202020]"}`}>
          <div className="flex items-center gap-2 text-[#6B6A68]">
            <CircleDashed className={`h-4 w-4 ${summary.outstandingThisMonth > 0 ? "text-rose-400" : ""}`} />
            <span className="text-xs uppercase tracking-wide">Outstanding</span>
          </div>
          <p className={`mt-2 text-xl font-bold ${summary.outstandingThisMonth > 0 ? "text-rose-400" : "text-[#E5E2E1]"}`}>
            {formatRupiah(summary.outstandingThisMonth)}
          </p>
        </div>

        <SpendChart data={summary.monthlySpend} />
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

      {active.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-[#202020] p-4 rounded-xl border border-[#2D2D2D]">
          <div className="relative flex-1 w-full max-w-sm">
            <input
              type="text"
              placeholder="Cari nama player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 pl-8 text-xs text-[#E5E2E1] placeholder-[#6B6A68] focus:border-[#9B9A97] focus:outline-none"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6B6A68]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9B9A97]">Filter Tim:</span>
            <CustomSelect
              value={selectedOrgFilter}
              options={filterOptions}
              onChange={setSelectedOrgFilter}
            />
          </div>
        </div>
      )}

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
      ) : filteredActive.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2D2D2D] bg-[#202020]/40 p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-[#6B6A68]" />
          <p className="mt-3 text-sm text-[#9B9A97]">Tidak ada player yang cocok dengan filter.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroupNames.map((orgName) => {
            const groupContracts = groupedActive[orgName] ?? [];
            return (
              <div key={orgName} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#2D2D2D] pb-2">
                  <div className="h-2.5 w-2.5 rounded bg-emerald-500" />
                  <h3 className="text-sm font-bold text-[#E5E2E1] uppercase tracking-wider">
                    {orgName} ({groupContracts.length})
                  </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {groupContracts.map((c) => (
                    <SalaryCard
                      key={c.id}
                      contract={c}
                      orgId={c.organization_id}
                      revalidatePaths={revalidatePaths}
                      onEdit={() => openEdit(c)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inactive.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-[#6B6A68] uppercase tracking-wide mt-6">
            Tidak Aktif ({inactive.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 opacity-60 mt-4">
            {inactive.map((c) => (
              <SalaryCard
                key={c.id}
                contract={c}
                orgId={c.organization_id}
                revalidatePaths={revalidatePaths}
                onEdit={() => openEdit(c)}
              />
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <SalaryFormModal
          orgId={editTarget?.organization_id ?? orgs[0]?.id ?? ""}
          members={members}
          contract={editTarget}
          revalidatePaths={revalidatePaths}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
export { SalaryPageClient };
