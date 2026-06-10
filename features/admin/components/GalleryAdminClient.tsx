"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { GalleryForm } from "./GalleryForm";
import { deleteGalleryEntry } from "@/features/admin/actions";
import type { GalleryEntry } from "@/features/admin/queries";

interface Props {
  entries: GalleryEntry[];
}

const GalleryAdminClient = ({ entries: initialEntries }: Props) => {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryEntry | null>(null);
  const [deleting, setDeleting] = useState<GalleryEntry | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const handleDone = () => {
    setShowForm(false);
    setEditing(null);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteGalleryEntry(deleting.id);
    setDeletePending(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Entry dihapus");
    setEntries(prev => prev.filter(e => e.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Gallery & Achievement</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex cursor-pointer items-center gap-2 border border-[#F5C400] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Entry
        </button>
      </div>

      {(showForm && !editing) && (
        <div className="mb-6">
          <GalleryForm onDone={handleDone} />
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id}>
            {editing?.id === entry.id ? (
              <GalleryForm entry={entry} onDone={handleDone} />
            ) : (
              <div className="flex items-center gap-4 border border-[#2D2D2D] bg-[#141414] p-4">
                {entry.preview_images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.preview_images?.[0]} alt="" className="h-12 w-20 shrink-0 object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#E5E2E1]">{entry.title}</p>
                  <p className="text-xs text-[#9B9A97]">
                    {entry.position} · {entry.tournament_date} · order: {entry.sort_order}
                    {entry.metric_value && ` · metric: [${entry.metric_value}] ${entry.metric_label ?? ""}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(entry)} className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(entry)} className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
        pending={deletePending}
        title="Hapus Entry"
        message={`Hapus "${deleting?.title}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmPhrase="HAPUS"
      />
    </div>
  );
};
export { GalleryAdminClient };
