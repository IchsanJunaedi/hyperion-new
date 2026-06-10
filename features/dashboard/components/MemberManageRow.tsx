"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { changeRoleAction, removeMemberAction } from "../actions";
import type { MemberRole } from "@/types/database";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { CustomSelect } from "./CustomSelect";
import { useNotify } from "./NotifyModal";

interface MemberManageRowProps {
  memberId: string;
  name: string;
  orgName: string;
  role: string;
  isActive: boolean;
}

const ROLES: MemberRole[] = ["manager", "coach", "captain", "member"];

const ROLE_COLORS: Record<string, string> = {
  owner: "text-yellow-400",
  manager: "text-green-400",
  coach: "text-blue-400",
  captain: "text-purple-400",
  member: "text-ui-text-2",
};

const MemberManageRow = ({
  memberId,
  name,
  orgName,
  role,
  isActive,
}: MemberManageRowProps) => {
  const [currentRole, setCurrentRole] = useState(role);
  const [rolePending, startRoleTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { success, error: notifyError } = useNotify();

  if (deleted) return null;

  function handleRoleChange(newRole: string) {
    startRoleTransition(async () => {
      const res = await changeRoleAction(memberId, newRole as MemberRole);
      if (res.ok) {
        setCurrentRole(newRole);
        success(`Role diubah ke ${newRole}`);
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleConfirmDelete() {
    startDeleteTransition(async () => {
      const res = await removeMemberAction(memberId);
      if (res.ok) {
        setDeleted(true);
        setDeleteOpen(false);
        success(`${name} dihapus dari tim`);
      } else {
        notifyError(res.message);
      }
    });
  }

  const isOwner = role === "owner";

  return (
    <tr className="transition hover:bg-white/[0.02]">
      <td className="px-4 py-3 text-ui-text">{name}</td>
      <td className="px-4 py-3 text-ui-text-2">{orgName}</td>
      <td className="px-4 py-3">
        {isOwner ? (
          <span className={`text-xs font-medium ${ROLE_COLORS.owner}`}>owner</span>
        ) : (
          <CustomSelect
            value={currentRole}
            onChange={handleRoleChange}
            disabled={rolePending}
            options={ROLES.map((r) => ({
              value: r,
              label: r,
              color: ROLE_COLORS[r],
            }))}
          />
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs ${isActive ? "text-green-400" : "text-ui-text-muted"}`}>
          {isActive ? "Aktif" : "Nonaktif"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {!isOwner && (
          <>
            <button
              type="button"
              disabled={deletePending}
              onClick={() => setDeleteOpen(true)}
              className="rounded-md p-1.5 text-ui-text-muted hover:bg-ui-hover hover:text-red-400 disabled:opacity-40"
              title="Hapus dari tim"
            >
              {deletePending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
            <ConfirmDeleteDialog
              open={deleteOpen}
              title="Hapus Member"
              message={`Yakin hapus ${name} dari tim? Data member akan dihapus permanen.`}
              confirmPhrase="HAPUS"
              pending={deletePending}
              onConfirm={handleConfirmDelete}
              onCancel={() => setDeleteOpen(false)}
            />
          </>
        )}
      </td>
    </tr>
  );
};
export { MemberManageRow };
