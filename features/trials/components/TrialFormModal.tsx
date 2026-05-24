"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createTrialAction } from "@/features/trials/actions";

interface TrialFormModalProps {
  divisionId: string | null;
  revalidatePaths: string[];
  onClose: () => void;
}

const POSITION_SUGGESTIONS = [
  "Jungler", "Mid Lane", "Exp Lane", "Roamer", "Gold Lane",
];

export function TrialFormModal({ divisionId, revalidatePaths, onClose }: TrialFormModalProps) {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [pending, startTransition] = useTransition();
  const [positions, setPositions] = useState<string[]>([]);
  const [posInput, setPosInput] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function addPosition(pos: string) {
    const trimmed = pos.trim();
    if (!trimmed || positions.includes(trimmed)) return;
    setPositions((prev) => [...prev, trimmed]);
    setPosInput("");
  }

  function removePosition(pos: string) {
    setPositions((prev) => prev.filter((p) => p !== pos));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setErr(null);
      const res = await createTrialAction(
        { title: fd.get("title"), division_id: divisionId, positions },
        revalidatePaths
      );
      if (res.ok) {
        success("Trial berhasil dibuat");
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
          <h3 className="text-base font-bold text-[#E5E2E1]">Buat Open Trial</h3>
          <button type="button" onClick={onClose} className="text-[#9B9A97] hover:text-[#E5E2E1] cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Judul Trial <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Posisi yang Dibutuhkan</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={posInput}
                onChange={(e) => setPosInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addPosition(posInput); }
                }}
                className="h-9 flex-1 rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addPosition(posInput)}
                className="h-9 rounded-md border border-[#2D2D2D] px-3 text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {(() => {
              const remaining = POSITION_SUGGESTIONS.filter((s) => !positions.includes(s));
              return remaining.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {remaining.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addPosition(s)}
                      className="rounded-full border border-[#2D2D2D] px-2 py-0.5 text-[10px] text-[#6B6A68] hover:border-[#9B9A97] hover:text-[#9B9A97] cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
                  {remaining.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPositions((prev) => [...prev, ...remaining])}
                      className="rounded-full border border-[#2D2D2D] bg-[#2C2C2C] px-2 py-0.5 text-[10px] text-[#9B9A97] hover:border-[#9B9A97] hover:text-[#E5E2E1] cursor-pointer"
                    >
                      + Semua
                    </button>
                  )}
                </div>
              ) : null;
            })()}
            {positions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {positions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-full bg-[#2C2C2C] px-2 py-0.5 text-xs text-[#E5E2E1]"
                  >
                    {p}
                    <button type="button" onClick={() => removePosition(p)} className="cursor-pointer">
                      <X className="h-2.5 w-2.5 text-[#9B9A97]" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
              Buat Trial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
