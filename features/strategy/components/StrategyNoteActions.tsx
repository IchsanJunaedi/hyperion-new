"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { deleteStrategyNoteAction } from "../actions";

interface StrategyNoteActionsProps {
  orgSlug: string;
  noteId: string;
}

const StrategyNoteActions = ({
  orgSlug,
  noteId,
}: StrategyNoteActionsProps) => {
  const router = useRouter();
  const [deletePending, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startDeleteTransition(async () => {
      const res = await deleteStrategyNoteAction(orgSlug, noteId);
      if (res.ok) {
        notify.success("Catatan dihapus");
        router.push(`/${orgSlug}/strategy`);
      } else {
        notify.error(res.message);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/${orgSlug}/strategy/${noteId}/edit`}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-ui-border px-3 text-xs font-medium text-ui-text transition hover:bg-ui-elevated hover:text-ui-text"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit catatan
      </Link>

      <button
        type="button"
        disabled={deletePending}
        onClick={handleDelete}
        className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition disabled:opacity-50 ${
          confirmDelete
            ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "border-ui-border text-ui-text hover:bg-ui-elevated hover:text-ui-text"
        }`}
      >
        {deletePending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        {confirmDelete ? "Yakin hapus?" : "Hapus catatan"}
      </button>
    </div>
  );
};
export { StrategyNoteActions };
