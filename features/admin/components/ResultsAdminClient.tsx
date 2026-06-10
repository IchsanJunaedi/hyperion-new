"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Medal, ImagePlus, X } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { toggleResultPublicAction, updateResultImageAction } from "@/features/admin/actions";
import type { AdminResult } from "@/features/admin/queries";

interface Props { results: AdminResult[]; }

const PLACEMENT_COLOR: Record<number, string> = { 1: "text-[#F5C400]", 2: "text-ui-text-2", 3: "text-[#CD7F32]" };

const ResultsAdminClient = ({ results: initial }: Props) => {
  const [results, setResults] = useState(initial);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleTogglePublic = (id: string, current: boolean) => {
    const next = !current;
    setResults((prev) => prev.map((r) => r.id === id ? { ...r, is_public: next } : r));
    startTransition(async () => {
      const result = await toggleResultPublicAction(id, next);
      if (!result.ok) {
        toast.error((result as { ok: false; message: string }).message);
        setResults((prev) => prev.map((r) => r.id === id ? { ...r, is_public: current } : r));
      } else {
        toast.success(next ? "Hasil dipublikasikan" : "Hasil disembunyikan dari publik");
      }
    });
  };

  const handleImageChange = async (id: string, url: string | null) => {
    setResults((prev) => prev.map((r) => r.id === id ? { ...r, result_image_url: url } : r));
    const result = await updateResultImageAction(id, url);
    if (!result.ok) toast.error((result as { ok: false; message: string }).message);
    else toast.success(url ? "Foto disimpan" : "Foto dihapus");
    setUploadingId(null);
  };

  const publicCount = results.filter((r) => r.is_public).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight text-ui-text">Results</h1>
        <p className="mt-1 text-xs text-ui-text-muted">
          Upload foto podium/poster dan toggle mana hasil turnamen yang tampil di <span className="text-ui-text-2">/results</span>.
          Hasil dicatat otomatis oleh manager saat menyelesaikan turnamen di workspace.
        </p>
        {publicCount > 0 && <p className="mt-1.5 text-xs font-semibold text-[#F5C400]">{publicCount} publik</p>}
      </div>

      {results.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center border border-ui-border">
          <Medal className="h-8 w-8 text-ui-border" />
          <p className="text-sm text-ui-text-muted">Belum ada hasil turnamen. Manager perlu menyelesaikan turnamen di workspace terlebih dahulu.</p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.id} className={`rounded border p-4 transition ${r.is_public ? "border-[#F5C400]/30 bg-[#F5C400]/5" : "border-ui-border bg-ui-bg"}`}>
            <div className="flex items-start gap-4">
              {/* Photo */}
              <div className="shrink-0">
                {r.result_image_url ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.result_image_url} alt="" className="h-16 w-24 object-cover" />
                    <button onClick={() => handleImageChange(r.id, null)}
                      className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setUploadingId(r.id)}
                    className="flex h-16 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-ui-border text-ui-text-muted hover:border-[#F5C400]/50 hover:text-[#F5C400] transition">
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Foto</span>
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ui-text-dim truncate">{r.tournament_name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                  {r.placement ? (
                    <span className={`font-bold ${PLACEMENT_COLOR[r.placement] ?? "text-ui-text-2"}`}>
                      Juara {r.placement}
                    </span>
                  ) : (
                    <span className="text-ui-text-muted">Gugur</span>
                  )}
                  {r.prize_earned && <span className="text-ui-text-muted">· Rp {Number(r.prize_earned).toLocaleString("id-ID")}</span>}
                  <span className="text-ui-text-muted">· {r.recorded_at.slice(0, 10)}</span>
                </div>
                {r.notes && <p className="mt-1 text-xs text-ui-text-muted truncate">{r.notes}</p>}
              </div>

              {/* Toggle */}
              <button onClick={() => handleTogglePublic(r.id, r.is_public)}
                className={`shrink-0 cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition ${r.is_public ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-ui-border text-ui-text-muted hover:border-[#F5C400]/50 hover:text-[#F5C400]"}`}>
                {r.is_public ? "Publik ✓" : "Publik"}
              </button>
            </div>

            {/* Inline image upload when triggered */}
            {uploadingId === r.id && (
              <div className="mt-3 border-t border-ui-border pt-3">
                <ImageUpload value={r.result_image_url} onChange={(url) => handleImageChange(r.id, url)} folder="results" label="Upload foto podium / poster" />
                <button onClick={() => setUploadingId(null)} className="mt-2 text-xs text-ui-text-muted hover:text-ui-text-2 cursor-pointer">Batal</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export { ResultsAdminClient };
