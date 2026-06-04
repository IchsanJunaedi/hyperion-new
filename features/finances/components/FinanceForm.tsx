"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { NumberInput } from "@/components/ui/number-input";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createFinanceAction } from "@/features/finances/actions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/validations/finance";

interface FinanceFormProps {
  orgId: string;
  revalidatePaths: string[];
  onClose: () => void;
}

const FinanceForm = ({ orgId, revalidatePaths, onClose }: FinanceFormProps) => {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<"income" | "expense">("income");
  const [error, setError] = useState<string | null>(null);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const res = await createFinanceAction(orgId, {
        type,
        amount: fd.get("amount"),
        category: fd.get("category"),
        description: fd.get("description"),
        date: fd.get("date"),
      }, revalidatePaths);
      if (res.ok) {
        success("Transaksi berhasil disimpan");
        onClose();
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-[#2D2D2D] bg-[#202020] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#E5E2E1]">Tambah Transaksi</h3>
          <button onClick={onClose} className="text-[#9B9A97] hover:text-[#E5E2E1]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-[#9B9A97] mb-2">Tipe</p>
            <div className="flex rounded-md border border-[#2D2D2D] overflow-hidden">
              {(["income", "expense"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    type === t
                      ? t === "income" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      : "bg-[#191919] text-[#9B9A97] hover:bg-[#2C2C2C]"
                  }`}
                >
                  {t === "income" ? "Pemasukan" : "Pengeluaran"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Jumlah (Rp)</label>
            <NumberInput
              name="amount"
              min={1}
              required
              placeholder="500000"
              className="focus:border-[#E5E2E1]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Kategori</label>
            <select
              key={type}
              name="category"
              required
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#E5E2E1] focus:outline-none"
            >
              <option value="">— Pilih kategori —</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Deskripsi (opsional)</label>
            <input
              name="description"
              type="text"
              maxLength={500}
              placeholder="Catatan singkat..."
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#E5E2E1] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Tanggal</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#E5E2E1] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-[#2D2D2D] px-4 text-sm text-[#9B9A97] hover:bg-[#2C2C2C]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white disabled:opacity-50"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export { FinanceForm };
