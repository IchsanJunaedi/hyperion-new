"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { useRouter } from "next/navigation";

import { assignRoleAction } from "../actions";
import type { MemberRole } from "@/types/database";

interface AssignRoleFormProps {
  users: Array<{ id: string; label: string }>;
  organizations: Array<{ id: string; name: string; slug: string }>;
  divisions: Array<{ id: string; organizationId: string; name: string }>;
  orgRoleHolders: Record<string, Record<string, string>>; // org_id → role → holder name
  orgAssignedUserIds: Record<string, string[]>; // org_id → user_ids already in that org
}

const ALL_ROLES: Array<{ value: MemberRole; label: string }> = [
  { value: "manager", label: "Manager" },
  { value: "coach", label: "Coach" },
  { value: "captain", label: "Captain" },
  { value: "member", label: "Member" },
];

const AssignRoleForm = ({
  users,
  organizations,
  divisions,
  orgRoleHolders,
  orgAssignedUserIds,
}: AssignRoleFormProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedDiv, setSelectedDiv] = useState("");
  const [selectedRole, setSelectedRole] = useState<MemberRole | "">("");
  const [error, setError] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.label.localeCompare(b.label)),
    [users],
  );

  // Orgs where the selected user doesn't have a role yet
  const availableOrgs = useMemo(() => {
    if (!selectedUser) return organizations;
    return organizations.filter(
      (o) => !(orgAssignedUserIds[o.id] ?? []).includes(selectedUser),
    );
  }, [selectedUser, organizations, orgAssignedUserIds]);

  const filteredDivisions = divisions.filter((d) => d.organizationId === selectedOrg);

  // All roles always available — action will demote old holder if needed
  const availableRoles = ALL_ROLES;

  // Warning: role already held by someone else in selected org + selected user isn't that person
  const replaceWarning = useMemo(() => {
    if (!selectedOrg || !selectedRole || !selectedUser) return null;
    const holders = orgRoleHolders[selectedOrg] ?? {};
    const holderName = holders[selectedRole];
    if (!holderName) return null;
    // Check if selected user IS the current holder (no warning needed)
    const holderEntry = users.find((u) => u.label === holderName);
    if (holderEntry?.id === selectedUser) return null;
    return holderName;
  }, [selectedOrg, selectedRole, selectedUser, orgRoleHolders, users]);

  function handleUserChange(v: string) {
    setSelectedUser(v);
    setSelectedOrg("");
    setSelectedDiv("");
    setSelectedRole("");
  }
  function handleOrgChange(v: string) {
    setSelectedOrg(v);
    setSelectedDiv("");
    setSelectedRole("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!selectedUser || !selectedOrg || !selectedRole) {
      setError("Lengkapi semua field");
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await assignRoleAction({
        userId: selectedUser,
        organizationId: selectedOrg,
        divisionId: selectedDiv || null,
        role: selectedRole as MemberRole,
      });
      if (res.ok) {
        notify.success("Role berhasil di-assign");
        setSelectedUser("");
        setSelectedOrg("");
        setSelectedDiv("");
        setSelectedRole("");
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  const selectCls =
    "h-10 w-full rounded border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:outline-none focus:border-[#4D4D4D] transition appearance-none cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="1. Pilih User" name="user_id">
        <select
          name="user_id"
          required
          value={selectedUser}
          onChange={(e) => handleUserChange(e.target.value)}
          className={selectCls}
        >
          <option value="" disabled>Pilih user...</option>
          {sortedUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.label}</option>
          ))}
        </select>
      </Field>

      {selectedUser && (
        <Field label="2. Pilih Tim" name="organization_id">
          <select
            name="organization_id"
            required
            value={selectedOrg}
            onChange={(e) => handleOrgChange(e.target.value)}
            className={selectCls}
          >
            <option value="" disabled>Pilih tim...</option>
            {availableOrgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          {availableOrgs.length === 0 && (
            <p className="mt-1 text-xs text-[#6B6A68]">User ini sudah ada di semua tim.</p>
          )}
        </Field>
      )}

      {selectedOrg && filteredDivisions.length > 0 && (
        <Field label="3. Pilih Divisi (opsional)" name="division_id">
          <select
            name="division_id"
            value={selectedDiv}
            onChange={(e) => setSelectedDiv(e.target.value)}
            className={selectCls}
          >
            <option value="">Tanpa divisi</option>
            {filteredDivisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>
      )}

      {selectedOrg && (
        <Field label={`${filteredDivisions.length > 0 ? "4" : "3"}. Pilih Role`} name="role">
          <select
            name="role"
            required
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
            className={selectCls}
          >
            <option value="" disabled>Pilih role...</option>
            {availableRoles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {replaceWarning && (
            <p className="mt-1 text-xs text-amber-400/80">
              ⚠ {selectedRole} tim ini sudah diisi oleh <strong>{replaceWarning}</strong> — akan di-replace ke member.
            </p>
          )}
        </Field>
      )}

      {error && (
        <p className="rounded border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !selectedUser || !selectedOrg || !selectedRole}
        className="inline-flex h-9 items-center gap-2 rounded border border-[#2D2D2D] bg-[#252525] px-4 text-xs font-medium text-[#E5E2E1] transition-all hover:bg-[#2D2D2D] hover:border-[#3D3D3D] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Assign Role
      </button>
    </form>
  );
};
export { AssignRoleForm };

function Field({
  label,
  name,
  children,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-xs text-[#9B9A97]">
        {label}
      </label>
      {children}
    </div>
  );
}
