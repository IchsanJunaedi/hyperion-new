"use client";

import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { renameDivisionAction, deleteDivisionAction } from "../actions";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useNotify } from "./NotifyModal";

interface DivisionListItemProps {
  id: string;
  name: string;
  isActive: boolean;
}

const DivisionListItem = ({ id, name, isActive }: DivisionListItemProps) => {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [pending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { success, error: notifyError } = useNotify();

  if (deleted) return null;

  function handleSave() {
    if (!editName.trim() || editName.trim() === name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await renameDivisionAction(id, editName.trim());
      if (res.ok) {
        success("Divisi diubah");
        setEditing(false);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleConfirmDelete() {
    startTransition(async () => {
      const res = await deleteDivisionAction(id);
      if (res.ok) {
        success("Divisi dihapus");
        setDeleted(true);
        setDeleteOpen(false);
      } else {
        notifyError(res.message);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-7 flex-1 rounded border border-white/10 bg-zinc-900 px-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <button type="button" disabled={pending} onClick={handleSave} className="rounded p-1 text-green-400 hover:bg-white/10">
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => { setEditing(false); setEditName(name); }} className="rounded p-1 text-white/40 hover:bg-white/10">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium text-ui-text">{name}</span>
              {!isActive && (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">Arsip</span>
              )}
            </>
          )}
        </div>
        {!editing && (
          <div className="flex gap-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => setEditing(true)}
              className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-ui-text disabled:opacity-40"
              title="Edit nama"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDeleteOpen(true)}
              className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-red-400 disabled:opacity-40"
              title="Hapus"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Hapus Divisi"
        message={`Yakin hapus divisi "${name}"? Ini tidak bisa dibatalkan.`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
};
export { DivisionListItem };
