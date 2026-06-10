"use client";

import { Loader2, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { deleteAnnouncementAction, togglePinAction } from "../actions";

interface AnnouncementActionsProps {
  orgSlug: string;
  announcementId: string;
  isPinned: boolean;
}

const AnnouncementActions = ({
  orgSlug,
  announcementId,
  isPinned,
}: AnnouncementActionsProps) => {
  const router = useRouter();
  const [pinPending, startPinTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleTogglePin() {
    startPinTransition(async () => {
      const res = await togglePinAction(orgSlug, announcementId, !isPinned);
      if (res.ok) {
        notify.success(isPinned ? "Pin dicabut" : "Pengumuman di-pin");
        router.refresh();
      } else {
        notify.error(res.message);
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
        notify.success("Pengumuman dihapus");
        router.push(`/${orgSlug}/announcements`);
      } else {
        notify.error(res.message);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/${orgSlug}/announcements/${announcementId}/edit`}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-ui-border px-3 text-xs font-medium text-ui-text transition hover:bg-ui-elevated hover:text-ui-text"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Link>

      <button
        type="button"
        disabled={pinPending}
        onClick={handleTogglePin}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-ui-border px-3 text-xs font-medium text-ui-text transition hover:bg-ui-elevated hover:text-ui-text disabled:opacity-50"
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
            : "border-ui-border text-ui-text hover:bg-ui-elevated hover:text-ui-text"
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
};
export { AnnouncementActions };
