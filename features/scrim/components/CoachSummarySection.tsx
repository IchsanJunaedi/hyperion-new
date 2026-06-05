"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { updateCoachSummaryAction } from "@/features/scrim/actions/coachSummaryAction";

interface CoachSummarySectionProps {
  scrimId: string;
  initialSummary: string | null;
  canEdit: boolean;
}

const CoachSummarySection = ({
  scrimId,
  initialSummary,
  canEdit,
}: CoachSummarySectionProps) => {
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialSummary ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nothing to show to a read-only viewer when there is no summary yet.
  if (!canEdit && !summary) return null;

  async function handleSave() {
    const trimmed = draft.trim();
    if (trimmed === (summary ?? "")) {
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);
    const res = await updateCoachSummaryAction(scrimId, trimmed);
    setIsSubmitting(false);

    if (res.ok) {
      setSummary(trimmed.length > 0 ? trimmed : null);
      setIsEditing(false);
      toast.success(trimmed.length > 0 ? "Catatan coach disimpan" : "Catatan coach dihapus");
    } else {
      toast.error(res.message || "Terjadi kesalahan");
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-white/55" />
          <h2 className="text-sm font-semibold text-white">Catatan Coach</h2>
        </div>
        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setDraft(summary ?? "");
              setIsEditing(true);
            }}
            className="cursor-pointer text-xs font-medium text-white/50 transition-colors hover:text-white"
          >
            {summary ? "Edit" : "Tambah Catatan"}
          </button>
        )}
      </div>

      {!isEditing ? (
        summary ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">
            {summary}
          </p>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-white/10 py-4">
            <p className="text-xs text-white/40">Belum ada ringkasan evaluasi coach.</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Ringkasan evaluasi keseluruhan scrim: apa yang berjalan baik, kelemahan, fokus latihan berikutnya..."
            className="w-full resize-y rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              className="cursor-pointer rounded-md px-3 py-1.5 text-xs text-white/50 hover:text-white"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
export { CoachSummarySection };
