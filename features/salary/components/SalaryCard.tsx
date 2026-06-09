"use client";

import { ChevronDown, CheckCircle2, Clock, Gift, Loader2, Pencil, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { markPaymentPaidAction } from "@/features/salary/actions";
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

const SalaryCard = ({ contract, orgId, revalidatePaths, onEdit }: SalaryCardProps) => {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paying, startPay] = useTransition();
  const [terminating, startTerminate] = useTransition();
  const [confirmTerminateOpen, setConfirmTerminateOpen] = useState(false);

  const thisMonth = currentPayPeriod();
  const thisMonthPayment = contract.payments.find((p) => p.pay_period.slice(0, 7) === thisMonth.slice(0, 7));
  const isPaidThisMonth = thisMonthPayment?.status === "paid";

  const totalBonus = useMemo(
    () => contract.bonusDistributions.reduce((sum, b) => sum + b.bonusAmount, 0),
    [contract.bonusDistributions],
  );

  const initials = (contract.display_name ?? "??")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  function handleMarkPaid() {
    startPay(async () => {
      const bonusNote = totalBonus > 0
        ? contract.bonusDistributions
            .map((b) => `${b.placement ? `Juara ${b.placement} ` : ""}${b.tournamentName} (${b.bonusPercentage}%) = Rp ${b.bonusAmount.toLocaleString("id-ID")}`)
            .join("; ")
        : null;
      const res = await markPaymentPaidAction(
        orgId,
        contract.id,
        thisMonth,
        contract.monthly_salary,
        revalidatePaths,
        totalBonus > 0 ? totalBonus : undefined,
        bonusNote,
      );
      if (res.ok) {
        success(totalBonus > 0 ? "Gaji + bonus turnamen dibayar!" : "Gaji bulan ini ditandai sudah dibayar");
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleTerminate() {
    startTerminate(async () => {
      const { terminateContractAction } = await import("@/features/salary/actions");
      const res = await terminateContractAction(orgId, contract.id, revalidatePaths);
      if (res.ok) {
        success("Kontrak diterminasi");
        router.refresh();
      } else {
        notifyError(res.message);
      }
      setConfirmTerminateOpen(false);
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
          {contract.status !== "active" && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[contract.status] ?? ""}`}>
              {contract.status}
            </span>
          )}
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

      {contract.bonus_percentage > 0 && (
        <p className="text-[10px] text-[#6B6A68]">
          Bonus turnamen: <span className="text-[#9B9A97] font-medium">{contract.bonus_percentage}% dari hadiah</span>
        </p>
      )}

      {expiring && (
        <p className="text-[10px] text-orange-400 bg-orange-500/10 rounded px-2 py-1">
          Kontrak berakhir dalam 30 hari
        </p>
      )}

      {/* This month payment */}
      {contract.status === "active" && (
        <div className="rounded-lg border border-[#2D2D2D] bg-[#191919]">
          {/* Status row */}
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 flex-wrap sm:flex-nowrap min-h-[48px]">
            <div className="shrink-0">
              <p className="text-[9px] text-[#6B6A68] uppercase tracking-wide font-medium">Bulan ini</p>
              {isPaidThisMonth ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80" />
                  <span className="text-xs text-[#E5E2E1]">Sudah dibayar</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-[#6B6A68]" />
                  <span className="text-xs text-[#9B9A97]">Belum dibayar</span>
                </div>
              )}
            </div>
            {!isPaidThisMonth && (
              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={paying}
                className="shrink-0 inline-flex h-8 items-center gap-1.5 rounded-md bg-[#E5E2E1] px-3 text-xs font-semibold text-[#191919] hover:bg-white disabled:opacity-50 cursor-pointer transition-colors"
              >
                {paying ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                <span>
                  {totalBonus > 0
                    ? `Bayar Rp ${(contract.monthly_salary + totalBonus).toLocaleString("id-ID")}`
                    : "Bayar"}
                </span>
              </button>
            )}
          </div>

          {/* Bonus distributions — read-only */}
          {contract.bonusDistributions.length > 0 && (
            <div className="border-t border-[#2D2D2D] px-3 py-2.5 space-y-2">
              <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-[#6B6A68]">
                <Gift className="h-3 w-3" />
                Bonus Turnamen Bulan Ini
              </p>
              <ul className="space-y-1">
                {contract.bonusDistributions.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-xs">
                    <span className="text-[#9B9A97] truncate max-w-[160px]">
                      {b.placement ? `Juara ${b.placement} — ` : ""}{b.tournamentName}
                    </span>
                    <span className="text-[#E5E2E1] font-semibold shrink-0 ml-2">
                      +Rp {b.bonusAmount.toLocaleString("id-ID")}
                    </span>
                  </li>
                ))}
              </ul>
              {!isPaidThisMonth && totalBonus > 0 && (
                <div className="flex items-center justify-between rounded bg-[#2C2C2C]/30 border border-[#2D2D2D] px-2.5 py-1.5">
                  <span className="text-[10px] text-[#9B9A97]">Total dibayar</span>
                  <span className="text-xs font-bold text-[#E5E2E1]">
                    Rp {(contract.monthly_salary + totalBonus).toLocaleString("id-ID")}
                  </span>
                </div>
              )}
            </div>
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
        <>
          <button
            type="button"
            onClick={() => setConfirmTerminateOpen(true)}
            disabled={terminating}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[#2D2D2D] py-1.5 text-xs text-[#6B6A68] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {terminating ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
            Terminate Kontrak
          </button>
          <ConfirmDeleteDialog
            open={confirmTerminateOpen}
            title="Terminate Kontrak"
            message={`Terminate kontrak ${contract.display_name ?? "player ini"}? Tindakan ini tidak bisa dibatalkan.`}
            confirmText="Terminate"
            pending={terminating}
            onConfirm={handleTerminate}
            onCancel={() => setConfirmTerminateOpen(false)}
          />
        </>
      )}
    </div>
  );
};
export { SalaryCard };
