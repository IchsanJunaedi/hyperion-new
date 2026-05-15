"use client";

import { Loader2, Pin, PinOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteAnnouncementAction, togglePinAction } from "../actions";

interface AnnouncementActionsProps {
  orgSlug: string;
  announcementId: string;
  isPinned: boolean;
}

export function AnnouncementActions({
  orgSlug,
  announcementId,
  isPinned,
}: AnnouncementActionsProps) {
  const router = useRouter();
  const [pinPending, startPinTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleTogglePin() {
    startPinTransition(async () => {
      const res = await togglePinAction(orgSlug, announcementId, !isPinned);
      if (res.ok) {
        toast.success(isPinned ? "Pin dicabut" : "Pengumuman di-pin");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startDeleteTransition(async () => {
      const res = await deleteAnnouncementAction(orgSlug, announcementId);
      if (res.ok) {
        toast.success("Pengumuman dihapus");
        router.push(`/${orgSlug}/announcements`);
      } else {
        toast.error(res.message);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pinPending}
        onClick={handleTogglePin}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
      >
        {pinPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isPinned ? (
          <PinOff className="h-3.5 w-3.5" />
        ) : (
          <Pin className="h-3.5 w-3.5" />
        )}
        {isPinned ? "Cabut pin" : "Pin"}
      </button>

      <button
        type="button"
        disabled={deletePending}
        onClick={handleDelete}
        className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition disabled:opacity-50 ${
          confirmDelete
            ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
        }`}
      >
        {deletePending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        {confirmDelete ? "Yakin hapus?" : "Hapus"}
      </button>
    </div>
  );
}
