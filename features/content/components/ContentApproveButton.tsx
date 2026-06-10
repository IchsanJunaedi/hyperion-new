"use client";

import { CheckCircle, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { updateContentStatusAction, deleteContentAction } from "@/features/content/actions";
import type { ContentStatus } from "@/types/database";

interface ContentActionButtonsProps {
  contentId: string;
  orgId: string;
  currentStatus: ContentStatus;
  isOwner: boolean;
  isCreatedByMe: boolean;
}

const ContentActionButtons = ({
  contentId, orgId, currentStatus, isOwner, isCreatedByMe,
}: ContentActionButtonsProps) => {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  function handleStatus(newStatus: ContentStatus) {
    startTransition(async () => {
      const res = await updateContentStatusAction(contentId, orgId, newStatus);
      if (res.ok) {
        success("Status konten diperbarui");
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteContentAction(contentId, orgId);
      if (res.ok) {
        success("Konten dihapus");
        setDeleteOpen(false);
        router.refresh();
      } else {
        notifyError(res.message);
        setDeleteOpen(false);
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      {/* Manager: submit for review */}
      {currentStatus === "draft" && (isCreatedByMe || isOwner) && (
        <button
          type="button"
          disabled={pending}
          onClick={() => handleStatus("scheduled")}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-yellow-500/30 px-2 text-xs text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Submit
        </button>
      )}

      {/* Owner: approve */}
      {currentStatus === "scheduled" && isOwner && (
        <button
          type="button"
          disabled={pending}
          onClick={() => handleStatus("approved")}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-green-500/30 px-2 text-xs text-green-400 hover:bg-green-500/10 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          Approve
        </button>
      )}

      {/* Owner: reject back to draft */}
      {currentStatus === "scheduled" && isOwner && (
        <button
          type="button"
          disabled={pending}
          onClick={() => handleStatus("draft")}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-white/10 px-2 text-xs text-ui-text-2 hover:bg-ui-hover disabled:opacity-50"
        >
          <RotateCcw className="h-3 w-3" /> Reject
        </button>
      )}

      {/* Mark as published */}
      {currentStatus === "approved" && (isOwner || isCreatedByMe) && (
        <button
          type="button"
          disabled={pending}
          onClick={() => handleStatus("published")}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-blue-500/30 px-2 text-xs text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
        >
          Publish
        </button>
      )}

      {/* Delete */}
      {(isOwner || (isCreatedByMe && currentStatus === "draft")) && (
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="rounded p-1 text-ui-text-2 hover:bg-ui-hover hover:text-red-400"
          title="Hapus konten"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Hapus Konten"
        message="Yakin hapus konten ini? Tindakan ini tidak bisa dibatalkan."
        confirmText="Hapus"
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
};
export { ContentActionButtons };
