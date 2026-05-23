"use client";

import { ChevronDown, CheckCircle2, Clock, Loader2, Pencil, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { markPaymentPaidAction, terminateContractAction } from "@/features/salary/actions";
import type { ContractWithProfile } from "@/features/salary/queries";

const ROLE_COLORS: Record<string, string> = {
  owner: "text-yellow-400",
  manager: "text-green-400",
  coach: "text-blue-400",
  captain: "text-purple-400",
  member: "text-[#9B9A97]",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  expired: "bg-orange-500/15 text-orange-400",
  terminated: "bg-red-500/15 text-red-400",
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function currentPayPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatPeriodLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function isExpiringSoon(endDate: string | null): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  return end >= new Date() && end <= in30;
}

interface SalaryCardProps {
  contract: ContractWithProfile;
  orgId: string;
  revalidatePaths: string[];
  onEdit: () => void;
}

export function SalaryCard({ contract, orgId, revalidatePaths, onEdit }: SalaryCardProps) {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paying, startPay] = useTransition();
  const [terminating, startTerminate] = useTransition();

  const thisMonth = currentPayPeriod();
  const thisMonthPayment = contract.payments.find((p) => p.pay_period.slice(0, 7) === thisMonth.slice(0, 7));
  const isPaidThisMonth = thisMonthPayment?.status === "paid";

  const initials = (contract.display_name ?? "??")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  function handleMarkPaid() {
    startPay(async () => {
      const res = await markPaymentPaidAction(orgId, contract.id, thisMonth, contract.monthly_salary, revalidatePaths);
      if (res.ok) {
        success("Gaji bulan ini ditandai sudah dibayar");
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleTerminate() {
    if (!confirm(`Terminate kontrak ${contract.display_name ?? "player ini"}? Tindakan ini tidak bisa dibatalkan.`)) return;
    startTerminate(async () => {
      const res = await terminateContractAction(orgId, contract.id, revalidatePaths);
      if (res.ok) {
        success("Kontrak diterminasi");
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  const expiring = isExpiringSoon(contract.end_date);

  return (
    <div className={`rounded-xl border bg-[#202020] p-4 space-y-3 ${expiring ? "border-orange-500/40" : "border-[#2D2D2D]"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#2C2C2C] text-xs font-bold text-[#D4D4D4]">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-[#E5E2E1]">
              {contract.display_name ?? "—"}
            </p>
            {contract.role && (
              <p className={`text-[10px] font-semibold uppercase ${ROLE_COLORS[contract.role] ?? "text-[#9B9A97]"}`}>
                {contract.role}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[contract.status] ?? ""}`}>
            {contract.status}
          </span>
          {contract.status === "active" && (
            <button type="button" onClick={onEdit} className="text-[#6B6A68] hover:text-[#9B9A97] cursor-pointer">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Salary + period */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[#6B6A68]">Gaji / bulan</p>
          <p className="text-sm font-semibold text-[#E5E2E1]">{formatRupiah(contract.monthly_salary)}</p>
        </div>
        <div>
          <p className="text-[#6B6A68]">Periode</p>
          <p className="text-[#9B9A97]">
            {formatPeriodLabel(contract.start_date)}
            {" — "}
            {contract.end_date ? formatPeriodLabel(contract.end_date) : "Indefinite"}
          </p>
        </div>
      </div>

      {expiring && (
        <p className="text-[10px] text-orange-400 bg-orange-500/10 rounded px-2 py-1">
          Kontrak berakhir dalam 30 hari
        </p>
      )}

      {/* This month payment */}
      {contract.status === "active" && (
        <div className="flex items-center justify-between rounded-lg border border-[#2D2D2D] bg-[#191919] px-3 py-2">
          <div>
            <p className="text-[10px] text-[#6B6A68] uppercase tracking-wide">Bulan ini</p>
            {isPaidThisMonth ? (
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs text-green-400">Sudah dibayar</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs text-orange-400">Belum dibayar</span>
              </div>
            )}
          </div>
          {!isPaidThisMonth && (
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={paying}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-green-500 px-3 text-xs font-semibold text-white hover:bg-green-400 disabled:opacity-50 cursor-pointer"
            >
              {paying ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Bayar
            </button>
          )}
        </div>
      )}

      {/* Payment history toggle */}
      {contract.payments.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between text-[11px] text-[#6B6A68] hover:text-[#9B9A97] cursor-pointer"
          >
            <span>Riwayat Pembayaran ({contract.payments.length} bulan)</span>
            <ChevronDown className={`h-3.5 w-3.5 transition ${historyOpen ? "rotate-180" : ""}`} />
          </button>

          {historyOpen && (
            <ul className="mt-2 space-y-1">
              {contract.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-[#9B9A97]">{formatPeriodLabel(p.pay_period)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6B6A68]">{formatRupiah(p.amount)}</span>
                    {p.status === "paid" ? (
                      <span className="text-green-400 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Dibayar
                      </span>
                    ) : (
                      <span className="text-orange-400 flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Terminate */}
      {contract.status === "active" && (
        <button
          type="button"
          onClick={handleTerminate}
          disabled={terminating}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-500/20 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 cursor-pointer"
        >
          {terminating ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
          Terminate Kontrak
        </button>
      )}
    </div>
  );
}
