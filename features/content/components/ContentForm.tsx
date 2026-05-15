"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createContentAction } from "@/features/content/actions";
import { PLATFORM_LABELS } from "@/lib/validations/content";

const PLATFORMS = ["ig", "tiktok", "x"] as const;

interface ContentFormProps {
  orgId: string;
  onClose: () => void;
}

export function ContentForm({ orgId, onClose }: ContentFormProps) {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const res = await createContentAction(orgId, {
        platform: fd.get("platform"),
        title: fd.get("title"),
        description: fd.get("description"),
        scheduled_at: fd.get("scheduled_at"),
      });
      if (res.ok) {
        success("Konten berhasil dibuat");
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
        className="w-full max-w-md rounded-xl border border-[#2D2D2D] bg-[#202020] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#E5E2E1]">Buat Konten</h3>
          <button onClick={onClose} className="text-[#9B9A97] hover:text-[#E5E2E1]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Platform</label>
            <select
              name="platform"
              required
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:outline-none"
            >
              {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Judul</label>
            <input
              name="title"
              type="text"
              required
              maxLength={200}
              placeholder="Judul konten..."
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#E5E2E1] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Deskripsi (opsional)</label>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              placeholder="Caption, hashtag, brief..."
              className="w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] focus:border-[#E5E2E1] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Jadwal Posting</label>
            <input
              name="scheduled_at"
              type="datetime-local"
              required
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#E5E2E1] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-9 rounded-md border border-[#2D2D2D] px-4 text-sm text-[#9B9A97] hover:bg-[#2C2C2C]">
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white disabled:opacity-50"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Simpan Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
