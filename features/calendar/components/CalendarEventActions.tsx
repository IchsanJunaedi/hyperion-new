"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { deleteCalendarEventAction } from "../actions";

interface CalendarEventActionsProps {
  orgSlug: string;
  eventId: string;
}

export function CalendarEventActions({
  orgSlug,
  eventId,
}: CalendarEventActionsProps) {
  const router = useRouter();
  const [deletePending, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startDeleteTransition(async () => {
      const res = await deleteCalendarEventAction(orgSlug, eventId);
      if (res.ok) {
        notify.success("Event dihapus");
        router.push(`/${orgSlug}/calendar`);
      } else {
        notify.error(res.message);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
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
        {confirmDelete ? "Yakin hapus?" : "Hapus event"}
      </button>
    </div>
  );
}
