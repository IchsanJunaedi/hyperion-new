"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { DivisionPublicForm } from "./DivisionPublicForm";
import { deleteDivisionPublic } from "@/features/admin/actions";
import type { DivisionPublic } from "@/features/admin/queries";

interface Props {
  divisions: DivisionPublic[];
}

const DivisionsAdminClient = ({ divisions: initial }: Props) => {
  const [divisions, setDivisions] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DivisionPublic | null>(null);
  const [deleting, setDeleting] = useState<DivisionPublic | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const handleDone = () => {
    setShowForm(false);
    setEditing(null);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteDivisionPublic(deleting.id);
    setDeletePending(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Division dihapus");
    setDivisions(prev => prev.filter(d => d.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Divisions</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex cursor-pointer items-center gap-2 border border-[#F5C400] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Division
        </button>
      </div>

      {showForm && !editing && (
        <div className="mb-6">
          <DivisionPublicForm onDone={handleDone} />
        </div>
      )}

      <div className="space-y-2">
        {divisions.map((division) => (
          <div key={division.id}>
            {editing?.id === division.id ? (
              <DivisionPublicForm division={division} onDone={handleDone} />
            ) : (
              <div className="flex items-center gap-4 border border-[#2D2D2D] bg-[#141414] p-4">
                {division.icon_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={division.icon_url} alt={division.name} className="h-10 w-10 shrink-0 object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#E5E2E1]">{division.name}</p>
                  <p className="text-xs text-[#9B9A97]">
                    {division.description && <span className="mr-1 truncate">{division.description} ·</span>}
                    {division.is_active ? "Aktif" : "Nonaktif"} · order: {division.sort_order}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(division)} className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(division)} className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-red-400">
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
        title="Hapus Division"
        message={`Hapus "${deleting?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmPhrase="HAPUS"
      />
    </div>
  );
};
export { DivisionsAdminClient };
