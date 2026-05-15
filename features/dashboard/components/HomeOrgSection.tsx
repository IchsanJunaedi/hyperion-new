"use client";

import Link from "next/link";
import { Building2, Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteOrgAction } from "../actions";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useNotify } from "./NotifyModal";

interface OrgRow {
  id: string;
  name: string;
  divisions: string;
  memberCount: number;
}

interface HomeOrgSectionProps {
  orgs: OrgRow[];
}

export function HomeOrgSection({ orgs }: HomeOrgSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<OrgRow | null>(null);
  const { success, error: notifyError } = useNotify();

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteOrgAction(deleteTarget.id);
      if (res.ok) {
        success(`Tim "${deleteTarget.name}" berhasil dihapus`);
        setDeleteTarget(null);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#E5E2E1] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#9B9A97]" /> Tim / Organisasi
          </h2>
          <Link href="/dashboard/teams" className="text-xs text-[#9B9A97] hover:text-[#D4D4D4] transition-colors">
            Detail →
          </Link>
        </div>
        <div className="flex flex-col">
          {orgs.length === 0 ? (
            <p className="py-3 px-3 text-sm text-[#6B6A68]">Belum ada tim</p>
          ) : (
            orgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center py-2 px-3 -mx-3 hover:bg-[#2C2C2C] rounded transition-colors gap-4 group"
              >
                <span className="flex-[2] text-sm text-[#D4D4D4] truncate">{org.name}</span>
                <span className="flex-1 text-sm text-[#9B9A97] truncate">{org.divisions || "—"}</span>
                <span className="flex-1 text-sm text-[#9B9A97]">{org.memberCount} member</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setDeleteTarget(org)}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 text-[#9B9A97] hover:text-red-400 hover:bg-[#353434] transition-all disabled:opacity-40"
                  title="Hapus tim"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Hapus Tim"
        message={`Yakin hapus tim "${deleteTarget?.name}"? Semua data tim termasuk divisi dan member akan hilang permanen.`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
