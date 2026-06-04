"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { deleteFinanceAction } from "@/features/finances/actions";

interface FinanceDeleteButtonProps {
  financeId: string;
  orgId: string;
  description: string;
  revalidatePaths: string[];
}

const FinanceDeleteButton = ({ financeId, orgId, description, revalidatePaths }: FinanceDeleteButtonProps) => {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const res = await deleteFinanceAction(financeId, orgId, revalidatePaths);
      if (res.ok) {
        success("Transaksi dihapus");
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
        className="rounded p-1 text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-red-400"
        title="Hapus transaksi"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <ConfirmDeleteDialog
        open={open}
        title="Hapus Transaksi"
        message={`Yakin hapus transaksi "${description}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Hapus"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};
export { FinanceDeleteButton };
