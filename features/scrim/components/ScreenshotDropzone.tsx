"use client";

import { useState } from "react";
import { Loader2, Sparkles, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { analyzeScreenshotAction } from "@/features/scrim/actions/analyzeScreenshotAction";
import type { DraftResult, ScoreboardResult } from "@/features/scrim/ai/screenshot-schema";
import { cn } from "@/lib/utils/cn";

type AnalyzedPayload =
  | { kind: "draft"; data: DraftResult }
  | { kind: "scoreboard"; data: ScoreboardResult };

interface ScreenshotDropzoneProps {
  kind: "draft" | "scoreboard";
  label: string;
  orgId: string;
  scrimId: string;
  gameIndex: number;
  onAnalyzed: (payload: AnalyzedPayload) => void;
}

const ScreenshotDropzone = ({
  kind, label, orgId, scrimId, gameIndex, onAnalyzed,
}: ScreenshotDropzoneProps) => {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { toast.error("Gambar maksimal 10MB"); return; }
    setBusy(true);
    setDone(false);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${orgId}/scrim-results/${scrimId}/game-${gameIndex + 1}-${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("org-private")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) { toast.error(upErr.message); return; }

      const res = await analyzeScreenshotAction({ kind, storagePath: path, orgId, scrimId });
      if (!res.ok) { toast.error(res.message); return; }

      if (res.kind === "draft") onAnalyzed({ kind: "draft", data: res.data });
      else onAnalyzed({ kind: "scoreboard", data: res.data });
      setDone(true);
      toast.success("AI selesai membaca — periksa & koreksi bila perlu");
    } catch {
      toast.error("Gagal memproses gambar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors",
        busy
          ? "border-yellow-400/40 bg-yellow-400/5 text-yellow-300"
          : done
          ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
          : "border-ui-border text-ui-text-2 hover:bg-ui-elevated",
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : done ? <CheckCircle2 className="h-3.5 w-3.5" />
        : <Sparkles className="h-3.5 w-3.5 text-yellow-400" />}
      <span className="flex-1">
        {busy ? "AI sedang memproses gambar…" : done ? `${label} terbaca` : label}
      </span>
      <Upload className="h-3.5 w-3.5 opacity-60" />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </label>
  );
};

export { ScreenshotDropzone };
export type { AnalyzedPayload };
