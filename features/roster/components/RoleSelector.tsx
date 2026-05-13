"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import type { MemberRole } from "@/types/database";
import { updateRoleAction } from "../actions/updateRole";

const ASSIGNABLE_ROLES: Array<{ value: MemberRole; label: string }> = [
  { value: "captain", label: "Captain" },
  { value: "coach", label: "Pelatih" },
  { value: "manager", label: "Manajer" },
  { value: "member", label: "Member" },
];

interface RoleSelectorProps {
  orgSlug: string;
  memberId: string;
  currentRole: MemberRole;
}

export function RoleSelector({
  orgSlug,
  memberId,
  currentRole,
}: RoleSelectorProps) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as MemberRole;
    if (role === currentRole) return;
    startTransition(async () => {
      const res = await updateRoleAction(orgSlug, memberId, role);
      if (res.ok) {
        toast.success("Role berhasil diubah");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={currentRole}
        onChange={handleChange}
        disabled={pending}
        className="h-7 rounded-md border border-white/10 bg-zinc-900 px-2 text-xs text-white focus:border-yellow-400 focus:outline-none disabled:opacity-50"
      >
        {ASSIGNABLE_ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="h-3 w-3 animate-spin text-white/40" />}
    </div>
  );
}
