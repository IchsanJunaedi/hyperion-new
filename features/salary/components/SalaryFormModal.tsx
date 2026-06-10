"use client";

import { ChevronDown, Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { NumberInput } from "@/components/ui/number-input";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createContractAction, updateContractAction } from "@/features/salary/actions";
import type { ContractWithProfile } from "@/features/salary/queries";

interface Member {
  user_id: string;
  display_name: string | null;
  role: string | null;
  organization_id?: string;
  org_name?: string | null;
}

interface SalaryFormModalProps {
  orgId: string;
  members: Member[];
  contract?: ContractWithProfile;
  revalidatePaths: string[];
  onClose: () => void;
}

const ROLE_BADGES: Record<string, { text: string; bg: string }> = {
  owner: { text: "text-amber-400", bg: "bg-amber-400/10" },
  manager: { text: "text-emerald-400", bg: "bg-emerald-400/10" },
  coach: { text: "text-sky-400", bg: "bg-sky-400/10" },
  captain: { text: "text-violet-400", bg: "bg-violet-400/10" },
  member: { text: "text-ui-text", bg: "bg-white/5" },
};

function formatSalaryDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

const SalaryFormModal = ({
  orgId,
  members,
  contract,
  revalidatePaths,
  onClose,
}: SalaryFormModalProps) => {
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
  const [selectedOrgId, setSelectedOrgId] = useState<string>(contract?.organization_id ?? orgId);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [playerQuery, setPlayerQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEdit = !!contract;

  const eligibleMembers = members.filter((m) => m.role?.toLowerCase() !== "owner");
  const selectedMember = members.find(
    (m) => m.user_id === selectedUserId && m.organization_id === selectedOrgId
  );

  const filteredDropdownMembers = eligibleMembers.filter((m) => {
    const nameMatch = m.display_name?.toLowerCase().includes(playerQuery.toLowerCase()) ?? false;
    const orgMatch = m.org_name?.toLowerCase().includes(playerQuery.toLowerCase()) ?? false;
    const roleMatch = m.role?.toLowerCase().includes(playerQuery.toLowerCase()) ?? false;
    return nameMatch || orgMatch || roleMatch;
  });

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
      const targetOrgId = selectedOrgId;
      const res = isEdit
        ? await updateContractAction(targetOrgId, raw, revalidatePaths)
        : await createContractAction(targetOrgId, raw, revalidatePaths);

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
        className="w-full max-w-md rounded-xl border border-ui-border bg-ui-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-ui-text">
            {isEdit ? "Edit Kontrak" : "Tambah Kontrak Player"}
          </h3>
          <button type="button" onClick={onClose} className="text-ui-text-2 hover:text-ui-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player custom dropdown */}
          <div>
            <label className="block text-xs text-ui-text-2 mb-1">
              Player <span className="text-red-400">*</span>
            </label>
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                disabled={isEdit}
                onClick={() => setDropdownOpen((v) => !v)}
                className="h-10 w-full flex items-center justify-between rounded-md border border-ui-border bg-ui-bg px-3 text-sm text-ui-text focus:border-ui-text-2 focus:outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {selectedMember ? (
                  <div className="flex-1 flex items-center justify-between min-w-0 mr-2">
                    <span className="truncate pr-2 text-left">
                      {selectedMember.display_name ?? selectedMember.user_id}{" "}
                      <span className="text-ui-text-muted text-xs font-normal">
                        {selectedMember.org_name ? `(${selectedMember.org_name})` : ""}
                      </span>
                    </span>
                    {selectedMember.role && (
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 ${
                        (ROLE_BADGES[selectedMember.role.toLowerCase()] || { text: "text-ui-text-2", bg: "bg-white/5" }).text
                      } ${
                        (ROLE_BADGES[selectedMember.role.toLowerCase()] || { text: "text-ui-text-2", bg: "bg-white/5" }).bg
                      }`}>
                        {selectedMember.role}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-ui-text-muted">— Pilih player —</span>
                )}
                <ChevronDown className={`h-4 w-4 text-ui-text-muted shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-ui-border bg-ui-surface shadow-xl max-h-60 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-ui-border shrink-0 bg-ui-surface">
                    <input
                      type="text"
                      placeholder="Cari player..."
                      autoFocus
                      value={playerQuery}
                      onChange={(e) => setPlayerQuery(e.target.value)}
                      className="h-8 w-full rounded border border-ui-border bg-ui-bg px-2.5 text-xs text-ui-text placeholder-ui-text-muted focus:border-ui-text-2 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 py-1 bg-ui-surface scroll-premium">
                    {filteredDropdownMembers.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-ui-text-muted">Tidak ada player yang cocok</p>
                    ) : (
                      filteredDropdownMembers.map((m) => (
                        <button
                          key={`${m.user_id}-${m.organization_id}`}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(m.user_id);
                            setSelectedOrgId(m.organization_id ?? orgId);
                            setDropdownOpen(false);
                            setPlayerQuery("");
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-sm text-ui-text hover:bg-ui-hover cursor-pointer"
                        >
                          <div className="flex-1 flex items-center justify-between min-w-0 mr-2">
                            <span className="truncate pr-2 text-left">
                              {m.display_name ?? m.user_id}{" "}
                              <span className="text-ui-text-muted text-xs font-normal">
                                {m.org_name ? `(${m.org_name})` : ""}
                              </span>
                            </span>
                            {m.role && (
                              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                (ROLE_BADGES[m.role.toLowerCase()] || { text: "text-ui-text-2", bg: "bg-white/5" }).text
                              } ${
                                (ROLE_BADGES[m.role.toLowerCase()] || { text: "text-ui-text-2", bg: "bg-white/5" }).bg
                              }`}>
                                {m.role}
                              </span>
                            )}
                          </div>
                          {selectedUserId === m.user_id && selectedOrgId === m.organization_id ? (
                            <Check className="h-3.5 w-3.5 text-ui-text-2 shrink-0" />
                          ) : (
                            <div className="h-3.5 w-3.5 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {!selectedUserId && (
              <input type="text" required className="sr-only" tabIndex={-1} readOnly value="" />
            )}
          </div>

          {/* Salary */}
          <div>
            <label className="block text-xs text-ui-text-2 mb-1">
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
              className="h-10 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-sm text-ui-text focus:border-ui-text-2 focus:outline-none"
            />
          </div>

          {/* Bonus percentage */}
          <div>
            <label className="block text-xs text-ui-text-2 mb-1">
              Persentase Bonus Turnamen (%)
            </label>
            <NumberInput
              min="0"
              max="100"
              step="0.1"
              value={bonusPct}
              onChange={(e) => setBonusPct(e.target.value)}
              placeholder="0"
              suffix="%"
            />
            <p className="mt-1 text-[10px] text-ui-text-muted">
              Jatah otomatis saat tim menang turnamen berhadiah. 0 = tidak dapat bonus.
            </p>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-ui-text-2 mb-1">
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
                className="h-10 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-sm text-ui-text focus:border-ui-text-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-ui-text-2 mb-1">Tanggal Berakhir</label>
              <input
                name="end_date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-sm text-ui-text focus:border-ui-text-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-ui-text-2 mb-1">Catatan</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={contract?.notes ?? ""}
              className="w-full rounded-md border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text focus:border-ui-text-2 focus:outline-none resize-none"
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
              className="h-9 rounded-md border border-ui-border px-4 text-sm text-ui-text-2 hover:bg-ui-hover cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending || !selectedUserId}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-ui-text px-4 text-sm font-semibold text-ui-bg hover:bg-white disabled:opacity-50 cursor-pointer"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Simpan" : "Tambah Kontrak"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { SalaryFormModal };
