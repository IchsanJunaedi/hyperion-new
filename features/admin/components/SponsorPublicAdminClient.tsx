"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Handshake, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { toggleSponsorPublicAction, updateSponsorSortAction } from "@/features/admin/actions";
import type { AdminSponsor } from "@/features/admin/queries";

interface Props { sponsors: AdminSponsor[]; }

const SponsorPublicAdminClient = ({ sponsors: initial }: Props) => {
  const [sponsors, setSponsors] = useState(initial);
  const [, startTransition] = useTransition();

  const handleTogglePublic = (id: string, current: boolean) => {
    const target = sponsors.find((s) => s.id === id);
    if (!target?.logo_url && !current) { toast.error("Sponsor tanpa logo tidak bisa dipublikasikan"); return; }
    const next = !current;
    setSponsors((prev) => prev.map((s) => s.id === id ? { ...s, is_public: next } : s));
    startTransition(async () => {
      const result = await toggleSponsorPublicAction(id, next);
      if (!result.ok) {
        toast.error((result as { ok: false; message: string }).message);
        setSponsors((prev) => prev.map((s) => s.id === id ? { ...s, is_public: current } : s));
      } else {
        toast.success(next ? "Sponsor dipublikasikan" : "Sponsor disembunyikan");
      }
    });
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const sorted = [...sponsors].sort((a, b) => a.public_sort_order - b.public_sort_order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx];
    const swap = sorted[swapIdx];
    if (!current || !swap) return;
    const newCurrentOrder = swap.public_sort_order;
    const newSwapOrder = current.public_sort_order;

    setSponsors((prev) => prev.map((s) => {
      if (s.id === current.id) return { ...s, public_sort_order: newCurrentOrder };
      if (s.id === swap.id) return { ...s, public_sort_order: newSwapOrder };
      return s;
    }));

    startTransition(async () => {
      await Promise.all([
        updateSponsorSortAction(current.id, newCurrentOrder),
        updateSponsorSortAction(swap.id, newSwapOrder),
      ]);
    });
  };

  const publicCount = sponsors.filter((s) => s.is_public).length;
  const sorted = [...sponsors].sort((a, b) => a.public_sort_order - b.public_sort_order);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight text-ui-text">Sponsors Publik</h1>
        <p className="mt-1 text-xs text-ui-text-muted">
          Pilih sponsor dari workspace yang tampil di halaman publik <span className="text-ui-text-2">/sponsors</span>.
          Hanya sponsor dengan logo yang bisa dipublikasikan.
        </p>
        {publicCount > 0 && <p className="mt-1.5 text-xs font-semibold text-[#F5C400]">{publicCount} publik</p>}
      </div>

      {sponsors.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center border border-ui-border">
          <Handshake className="h-8 w-8 text-ui-border" />
          <p className="text-sm text-ui-text-muted">Belum ada sponsor di workspace. Tambahkan sponsor di menu Sponsors workspace terlebih dahulu.</p>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((s, idx) => (
          <div key={s.id} className={`flex items-center gap-4 rounded border px-4 py-3 transition ${s.is_public ? "border-[#F5C400]/30 bg-[#F5C400]/5" : "border-ui-border bg-ui-bg"}`}>
            {s.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo_url} alt={s.name} className="h-10 w-16 shrink-0 object-contain" />
            ) : (
              <div className="flex h-10 w-16 shrink-0 items-center justify-center bg-ui-surface">
                <AlertCircle className="h-4 w-4 text-ui-text-muted" aria-label="Tidak ada logo" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ui-text-dim">{s.name}</p>
              <p className="text-xs text-ui-text-muted">
                Status: {s.status}
                {!s.logo_url && <span className="ml-2 text-red-400/70">· Tidak ada logo</span>}
              </p>
            </div>

            {s.is_public && (
              <div className="flex flex-col gap-0.5">
                <button onClick={() => handleMove(s.id, "up")} disabled={idx === 0}
                  className="cursor-pointer p-1 text-ui-text-muted hover:text-ui-text-dim disabled:opacity-30">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleMove(s.id, "down")} disabled={idx === sorted.length - 1}
                  className="cursor-pointer p-1 text-ui-text-muted hover:text-ui-text-dim disabled:opacity-30">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button onClick={() => handleTogglePublic(s.id, s.is_public)}
              disabled={!s.logo_url && !s.is_public}
              className={`shrink-0 cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition disabled:opacity-40 disabled:cursor-not-allowed ${s.is_public ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-ui-border text-ui-text-muted hover:border-[#F5C400]/50 hover:text-[#F5C400]"}`}>
              {s.is_public ? "Publik ✓" : "Publik"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export { SponsorPublicAdminClient };
