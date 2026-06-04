"use client";

import { BookOpen, Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { submitCoachNotesAction } from "@/features/scrim/actions/coachNotesAction";

interface CoachNotesSectionProps {
  scrimId: string;
  orgSlug: string;
  orgId: string;
  isCoach: boolean;
  existingNotes: string | null;
}

const CoachNotesSection = ({
  scrimId,
  orgSlug,
  orgId,
  isCoach,
  existingNotes,
}: CoachNotesSectionProps) => {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(existingNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Non-coaches only see the section if notes exist
  if (!isCoach && !existingNotes) return null;

  function handleSave() {
    startTransition(async () => {
      setError(null);
      const res = await submitCoachNotesAction(scrimId, orgSlug, orgId, draft);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.message ?? "Gagal menyimpan catatan.");
      }
    });
  }

  return (
    <article className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <BookOpen className="h-4 w-4 text-blue-400" />
          Catatan Coach
        </h2>
        {isCoach && !editing && (
          <button
            type="button"
            onClick={() => { setDraft(existingNotes ?? ""); setEditing(true); }}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white"
          >
            <Pencil className="h-3 w-3" />
            {existingNotes ? "Edit" : "Tambah"}
          </button>
        )}
        {isCoach && editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            maxLength={3000}
            placeholder="Evaluasi performa tim, area perbaikan, catatan taktis..."
            className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
          />
          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Simpan
          </button>
        </div>
      ) : existingNotes ? (
        <p className="whitespace-pre-line text-sm text-white/80">{existingNotes}</p>
      ) : (
        <p className="text-sm text-white/40 italic">Belum ada catatan coach.</p>
      )}
    </article>
  );
};
export { CoachNotesSection };
