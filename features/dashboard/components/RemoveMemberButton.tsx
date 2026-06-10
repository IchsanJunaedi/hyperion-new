"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { managerRemoveMemberAction } from "../actions";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useNotify } from "./NotifyModal";

interface RemoveMemberButtonProps {
  memberId: string;
  name: string;
}

const RemoveMemberButton = ({ memberId, name }: RemoveMemberButtonProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { success, error: notifyError } = useNotify();

  function handleConfirm() {
    startTransition(async () => {
      const res = await managerRemoveMemberAction(memberId);
      if (res.ok) {
        success(`${name} dihapus dari tim`);
        setOpen(false);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md p-1.5 text-ui-text-muted hover:bg-ui-hover hover:text-red-400"
        title="Hapus dari tim"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <ConfirmDeleteDialog
        open={open}
        title="Hapus Member"
        message={`Yakin hapus ${name} dari tim? Data member akan dihapus permanen.`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};
export { RemoveMemberButton };
