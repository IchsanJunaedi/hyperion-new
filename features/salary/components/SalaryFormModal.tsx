"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

  const isEdit = !!contract;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const raw = {
      user_id: fd.get("user_id"),
      monthly_salary: fd.get("monthly_salary"),
      start_date: fd.get("start_date"),
      end_date: fd.get("end_date") || undefined,
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
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Player <span className="text-red-400">*</span>
            </label>
            <select
              name="user_id"
              required
              defaultValue={contract?.user_id ?? ""}
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            >
              <option value="">— Pilih player —</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name ?? m.user_id}
                  {m.role ? ` (${m.role})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Gaji per Bulan (Rp) <span className="text-red-400">*</span>
            </label>
            <input
              name="monthly_salary"
              type="number"
              min={0}
              required
              defaultValue={contract?.monthly_salary ?? ""}
              placeholder="500000"
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#9B9A97] mb-1">
                Tanggal Mulai <span className="text-red-400">*</span>
              </label>
              <input
                name="start_date"
                type="date"
                required
                defaultValue={contract?.start_date ?? new Date().toISOString().slice(0, 10)}
                className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9B9A97] mb-1">
                Tanggal Berakhir{" "}
                <span className="text-[#6B6A68]">(kosong = indefinite)</span>
              </label>
              <input
                name="end_date"
                type="date"
                defaultValue={contract?.end_date ?? ""}
                className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Catatan</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={contract?.notes ?? ""}
              placeholder="Detail kontrak, bonus, dll..."
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
              disabled={pending}
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
