"use client";

import Link from "next/link";
import { Building2, ChevronRight, Loader2, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteOrgAction } from "../actions";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useNotify } from "./NotifyModal";

interface OrgMember {
  name: string;
  role: string;
  division: string | null;
}

interface OrgRow {
  id: string;
  name: string;
  divisions: string;
  memberCount: number;
  members: OrgMember[];
}

interface HomeOrgSectionProps {
  orgs: OrgRow[];
}

const roleColors: Record<string, string> = {
  owner: "text-yellow-400",
  manager: "text-blue-400",
  captain: "text-purple-400",
  coach: "text-pink-400",
  member: "text-[#9B9A97]",
};

export function HomeOrgSection({ orgs }: HomeOrgSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<OrgRow | null>(null);
  const [viewTarget, setViewTarget] = useState<OrgRow | null>(null);
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
          <Link
            href="/dashboard/teams"
            className="group flex items-center gap-2 text-lg font-semibold text-[#E5E2E1] hover:text-white transition-colors"
          >
            <Building2 className="h-4 w-4 text-[#9B9A97]" />
            <span>Tim</span>
            <ChevronRight className="h-4 w-4 text-[#9B9A97] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="flex flex-col">
          {orgs.length === 0 ? (
            <p className="py-3 px-3 text-sm text-[#6B6A68]">Belum ada tim</p>
          ) : (
            orgs.map((org) => (
              <div
                key={org.id}
                className="grid grid-cols-[200px_1fr_100px_32px] items-center py-2 px-3 -mx-3 hover:bg-[#2C2C2C] rounded transition-colors gap-4 group"
              >
                <span
                  className="text-sm text-[#D4D4D4] truncate cursor-pointer hover:text-white"
                  onClick={() => setViewTarget(org)}
                >
                  {org.name}
                </span>
                <span className="text-sm text-[#9B9A97] truncate">{org.divisions || "—"}</span>
                <span className="text-sm text-[#9B9A97]">{org.memberCount} member</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(org); }}
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

      {/* Team members popup */}
      {viewTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setViewTarget(null)}
        >
          <div
            className="bg-[#202020] border border-[#2D2D2D] rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#E5E2E1]">{viewTarget.name}</h3>
                <p className="text-xs text-[#9B9A97] mt-0.5">{viewTarget.members.length} anggota</p>
              </div>
              <button onClick={() => setViewTarget(null)} className="rounded p-1 text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {viewTarget.members.length === 0 ? (
              <p className="text-sm text-[#6B6A68] py-4">Belum ada anggota di tim ini.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {viewTarget.members.map((m, i) => {
                  const initials = m.name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0] ?? "")
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 -mx-3 hover:bg-[#2C2C2C] rounded-lg transition-colors gap-4"
                    >
                      {/* Left: Avatar + Name (Flex-1 & Truncate) */}
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-white/80">
                          {initials}
                        </div>
                        <span className="truncate text-sm font-medium text-[#E5E2E1]">
                          {m.name}
                        </span>
                      </div>

                      {/* Right: Game/Division + Role (Fixed min-width columns) */}
                      <div className="flex shrink-0 items-center justify-end gap-3 min-w-[160px] sm:min-w-[180px]">
                        {m.division && (
                          <span className="text-xs text-[#9B9A97] truncate max-w-[110px] text-right">
                            {m.division}
                          </span>
                        )}
                        <span className={`text-xs font-semibold ${roleColors[m.role] ?? "text-[#9B9A97]"} capitalize w-16 text-right`}>
                          {m.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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

