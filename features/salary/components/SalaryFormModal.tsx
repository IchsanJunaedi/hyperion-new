"use client";

import { ChevronDown, Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createContractAction, updateContractAction } from "@/features/salary/actions";
import type { ContractWithProfile } from "@/features/salary/queries";

interface Member {
  user_id: string;
  display_name: string | null;
  role: string | null;
}

interface SalaryFormModalProps {
  orgId: string;
  members: Member[];
  contract?: ContractWithProfile;
  revalidatePaths: string[];
  onClose: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  manager: "text-green-400",
  coach: "text-blue-400",
  captain: "text-purple-400",
  member: "text-[#9B9A97]",
};

function formatSalaryDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

export function SalaryFormModal({
  orgId,
  members,
  contract,
  revalidatePaths,
  onClose,
}: SalaryFormModalProps) {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [salaryDisplay, setSalaryDisplay] = useState<string>(
    contract?.monthly_salary != null ? Number(contract.monthly_salary).toLocaleString("id-ID") : ""
  );
  const [salaryRaw, setSalaryRaw] = useState<string>(
    contract?.monthly_salary != null ? String(contract.monthly_salary) : ""
  );
  const [bonusPct, setBonusPct] = useState<string>(
    contract?.bonus_percentage != null ? String(contract.bonus_percentage) : "0"
  );

  const [startDate, setStartDate] = useState<string>(
    contract?.start_date ?? new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(contract?.end_date ?? "");

  const [selectedUserId, setSelectedUserId] = useState<string>(contract?.user_id ?? "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEdit = !!contract;

  const selectedMember = members.find((m) => m.user_id === selectedUserId);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (endDate && endDate < startDate) {
      setErr("Tanggal berakhir tidak boleh sebelum tanggal mulai.");
      return;
    }

    const raw = {
      user_id: selectedUserId,
      monthly_salary: salaryRaw,
      bonus_percentage: bonusPct || "0",
      start_date: fd.get("start_date"),
      end_date: endDate || undefined,
      notes: fd.get("notes") || undefined,
      ...(isEdit ? { contract_id: contract.id } : {}),
    };

    startTransition(async () => {
      setErr(null);
      const res = isEdit
        ? await updateContractAction(orgId, raw, revalidatePaths)
        : await createContractAction(orgId, raw, revalidatePaths);

      if (res.ok) {
        success(isEdit ? "Kontrak diperbarui" : "Kontrak ditambahkan");
        onClose();
        router.refresh();
      } else {
        setErr(res.message);
        notifyError(res.message);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#2D2D2D] bg-[#202020] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#E5E2E1]">
            {isEdit ? "Edit Kontrak" : "Tambah Kontrak Player"}
          </h3>
          <button type="button" onClick={onClose} className="text-[#9B9A97] hover:text-[#E5E2E1]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player custom dropdown */}
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Player <span className="text-red-400">*</span>
            </label>
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="h-10 w-full flex items-center justify-between rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none cursor-pointer"
              >
                {selectedMember ? (
                  <span className="flex items-center gap-2">
                    <span>{selectedMember.display_name ?? selectedMember.user_id}</span>
                    {selectedMember.role && (
                      <span className={`text-[10px] font-semibold uppercase ${ROLE_COLORS[selectedMember.role] ?? "text-[#9B9A97]"}`}>
                        {selectedMember.role}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-[#6B6A68]">— Pilih player —</span>
                )}
                <ChevronDown className={`h-4 w-4 text-[#6B6A68] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-[#2D2D2D] bg-[#202020] py-1 shadow-xl max-h-48 overflow-y-auto scroll-premium">
                  {members.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-[#6B6A68]">Tidak ada member tersedia</p>
                  ) : (
                    members.map((m) => (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(m.user_id);
                          setDropdownOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm text-[#E5E2E1] hover:bg-[#2C2C2C] cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span>{m.display_name ?? m.user_id}</span>
                          {m.role && (
                            <span className={`text-[10px] font-semibold uppercase ${ROLE_COLORS[m.role] ?? "text-[#9B9A97]"}`}>
                              {m.role}
                            </span>
                          )}
                        </span>
                        {selectedUserId === m.user_id && (
                          <Check className="h-3.5 w-3.5 text-[#9B9A97]" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {!selectedUserId && (
              <input type="text" required className="sr-only" tabIndex={-1} readOnly value="" />
            )}
          </div>

          {/* Salary */}
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Gaji per Bulan (Rp) <span className="text-red-400">*</span>
            </label>
            <input
              name="monthly_salary_display"
              type="text"
              inputMode="numeric"
              required
              value={salaryDisplay ?? ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setSalaryRaw(digits);
                setSalaryDisplay(formatSalaryDisplay(e.target.value));
              }}
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            />
          </div>

          {/* Bonus percentage */}
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Persentase Bonus Turnamen (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={bonusPct}
                onChange={(e) => setBonusPct(e.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] pl-3 pr-8 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B6A68]">%</span>
            </div>
            <p className="mt-1 text-[10px] text-[#6B6A68]">
              Jatah otomatis saat tim menang turnamen berhadiah. 0 = tidak dapat bonus.
            </p>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#9B9A97] mb-1">
                Tanggal Mulai <span className="text-red-400">*</span>
              </label>
              <input
                name="start_date"
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate("");
                }}
                className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9B9A97] mb-1">Tanggal Berakhir</label>
              <input
                name="end_date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Catatan</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={contract?.notes ?? ""}
              className="w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none resize-none"
            />
          </div>

          {err && (
            <p className="text-xs text-red-400 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">
              {err}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-[#2D2D2D] px-4 text-sm text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending || !selectedUserId}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white disabled:opacity-50 cursor-pointer"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Simpan" : "Tambah Kontrak"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
