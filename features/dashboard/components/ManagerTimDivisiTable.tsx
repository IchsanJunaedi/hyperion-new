"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { removeMemberAction } from "../actions";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

interface ManagerRow {
  memberId: string;
  managerName: string;
  orgName: string;
  divisions: string;
}

interface ManagerTimDivisiTableProps {
  rows: ManagerRow[];
}

export function ManagerTimDivisiTable({ rows }: ManagerTimDivisiTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<ManagerRow | null>(null);

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await removeMemberAction(deleteTarget.memberId);
      if (res.ok) {
        toast.success(`${deleteTarget.managerName} dihapus dari ${deleteTarget.orgName}`);
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/40">
        Belum ada Manager yang di-assign.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Manager</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Tim</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Divisi</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/50">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.memberId} className="transition hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white/80">{r.managerName}</td>
                <td className="px-4 py-3 text-white/60">{r.orgName}</td>
                <td className="px-4 py-3 text-white/60">{r.divisions || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setDeleteTarget(r)}
                    className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-red-400 disabled:opacity-40"
                    title="Hapus manager dari tim"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Hapus Manager"
        message={`Yakin hapus ${deleteTarget?.managerName} sebagai manager dari ${deleteTarget?.orgName}?`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
