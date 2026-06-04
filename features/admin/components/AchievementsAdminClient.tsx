"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Trophy } from "lucide-react";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { AchievementForm } from "./AchievementForm";
import { deleteAchievement } from "@/features/admin/actions";
import type { Achievement } from "@/features/admin/queries";

const PLACEMENT_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Juara 1", color: "#F5C400" },
  2: { label: "Juara 2", color: "#9B9A97" },
  3: { label: "Juara 3", color: "#CD7F32" },
};

interface Props {
  entries: Achievement[];
}

const AchievementsAdminClient = ({ entries: initialEntries }: Props) => {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [deleting, setDeleting] = useState<Achievement | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const handleDone = () => {
    setShowForm(false);
    setEditing(null);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteAchievement(deleting.id);
    setDeletePending(false);
    if (!result.ok) {
      toast.error((result as { ok: false; message: string }).message);
      return;
    }
    toast.success("Achievement dihapus");
    setEntries((prev) => prev.filter((e) => e.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Achievements</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex cursor-pointer items-center gap-2 border border-[#F5C400] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Manual
        </button>
      </div>

      {showForm && !editing && (
        <div className="mb-6">
          <AchievementForm onDone={handleDone} />
        </div>
      )}

      <div className="space-y-2">
        {entries.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy className="h-8 w-8 text-[#2D2D2D]" />
            <p className="text-sm text-[#6B6A68]">Belum ada achievement.</p>
            <p className="text-xs text-[#6B6A68]">
              Achievement akan muncul otomatis saat turnamen diselesaikan dengan placement ≤ 3.
            </p>
          </div>
        )}

        {entries.map((entry) => {
          const placement = entry.placement ?? 0;
          const meta = PLACEMENT_LABELS[placement];
          return (
            <div key={entry.id}>
              {editing?.id === entry.id ? (
                <AchievementForm entry={entry} onDone={handleDone} />
              ) : (
                <div className="flex items-center gap-4 border border-[#2D2D2D] bg-[#141414] p-4">
                  {entry.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.image_url}
                      alt=""
                      className="h-12 w-20 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#1E1E1E]">
                      <Trophy className="h-5 w-5 text-[#2D2D2D]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#E5E2E1]">{entry.title}</p>
                    <div className="mt-0.5 flex items-center gap-3">
                      {meta && (
                        <span
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      )}
                      <span className="text-xs text-[#6B6A68]">
                        {entry.achieved_at?.slice(0, 4)}
                      </span>
                      {entry.tournament_id && (
                        <span className="text-xs text-[#6B6A68]">• Auto</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(entry)}
                      className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(entry)}
                      className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDeleteDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
        pending={deletePending}
        title="Hapus Achievement"
        message={`Hapus "${deleting?.title}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmPhrase="HAPUS"
      />
    </div>
  );
};
export { AchievementsAdminClient };
