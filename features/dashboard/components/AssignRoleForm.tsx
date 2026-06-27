"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { useRouter } from "next/navigation";

import { assignRoleAction } from "../actions";
import type { MemberRole } from "@/types/database";
import { CustomSelect } from "@/features/dashboard/components/CustomSelect";

interface AssignRoleFormProps {
  users: Array<{ id: string; label: string }>;
  organizations: Array<{ id: string; name: string; slug: string }>;
  divisions: Array<{ id: string; organizationId: string; name: string }>;
  orgRoleHolders: Record<string, Record<string, string>>; // org_id → role → holder name
  orgAssignedUserIds: Record<string, string[]>; // org_id → user_ids already in that org
  orgUserMainRoles: Record<string, Array<{ userId: string; mainRole: string }>>; // org_id → Array<{ userId, mainRole }>
}

const ALL_ROLES: Array<{ value: MemberRole; label: string }> = [
  { value: "manager", label: "Manager" },
  { value: "coach", label: "Coach" },
  { value: "captain", label: "Captain" },
  { value: "member", label: "Member" },
];

const IN_GAME_ROLES = [
  { value: "exp_lane", label: "EXP Lane" },
  { value: "jungler", label: "Jungler" },
  { value: "mid_lane", label: "Mid Lane" },
  { value: "gold_lane", label: "Gold Lane" },
  { value: "roamer", label: "Roamer" },
];

const AssignRoleForm = ({
  users,
  organizations,
  divisions,
  orgRoleHolders,
  orgAssignedUserIds,
  orgUserMainRoles,
}: AssignRoleFormProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedDiv, setSelectedDiv] = useState("");
  const [selectedRole, setSelectedRole] = useState<MemberRole | "">("");
  const [selectedInGameRole, setSelectedInGameRole] = useState<string>("");
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

  // Filter in-game roles by excluding those already taken by other players in the same organization
  const availableInGameRoles = useMemo(() => {
    if (!selectedOrg) return IN_GAME_ROLES;
    const takenRoles = (orgUserMainRoles[selectedOrg] ?? [])
      .filter((item) => item.userId !== selectedUser)
      .map((item) => item.mainRole);
    return IN_GAME_ROLES.filter((r) => !takenRoles.includes(r.value));
  }, [selectedOrg, selectedUser, orgUserMainRoles]);

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
    setSelectedInGameRole("");
  }
  function handleOrgChange(v: string) {
    setSelectedOrg(v);
    setSelectedDiv("");
    setSelectedRole("");
    setSelectedInGameRole("");
  }
  function handleRoleChange(v: string) {
    setSelectedRole(v as MemberRole);
    setSelectedInGameRole("");
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
        mainRole: selectedInGameRole || null,
      });
      if (res.ok) {
        notify.success("Role berhasil di-assign");
        setSelectedUser("");
        setSelectedOrg("");
        setSelectedDiv("");
        setSelectedRole("");
        setSelectedInGameRole("");
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  // Dynamic field indices
  let fieldIndex = 1;
  const userNum = fieldIndex++;
  const orgNum = selectedUser ? fieldIndex++ : 0;
  const divNum = selectedOrg && filteredDivisions.length > 0 ? fieldIndex++ : 0;
  const roleNum = selectedOrg ? fieldIndex++ : 0;
  const inGameRoleNum = selectedOrg && (selectedRole === "captain" || selectedRole === "member") ? fieldIndex++ : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={`${userNum}. Pilih User`} name="user_id">
        <CustomSelect
          value={selectedUser}
          onChange={handleUserChange}
          fullWidth
          placeholder="Pilih user..."
          options={sortedUsers.map((u) => ({
            value: u.id,
            label: u.label,
          }))}
        />
      </Field>

      {selectedUser && (
        <Field label={`${orgNum}. Pilih Tim`} name="organization_id">
          <CustomSelect
            value={selectedOrg}
            onChange={handleOrgChange}
            fullWidth
            placeholder="Pilih tim..."
            options={availableOrgs.map((o) => ({
              value: o.id,
              label: o.name,
            }))}
          />
          {availableOrgs.length === 0 && (
            <p className="mt-1 text-xs text-ui-text-muted">User ini sudah ada di semua tim.</p>
          )}
        </Field>
      )}

      {selectedOrg && filteredDivisions.length > 0 && (
        <Field label={`${divNum}. Pilih Divisi (opsional)`} name="division_id">
          <CustomSelect
            value={selectedDiv}
            onChange={setSelectedDiv}
            fullWidth
            placeholder="Tanpa divisi"
            options={[
              { value: "", label: "Tanpa divisi" },
              ...filteredDivisions.map((d) => ({
                value: d.id,
                label: d.name,
              })),
            ]}
          />
        </Field>
      )}

      {selectedOrg && (
        <Field label={`${roleNum}. Pilih Role`} name="role">
          <CustomSelect
            value={selectedRole}
            onChange={handleRoleChange}
            fullWidth
            placeholder="Pilih role..."
            options={availableRoles.map((r) => ({
              value: r.value,
              label: r.label,
            }))}
          />
          {replaceWarning && (
            <p className="mt-1 text-xs text-amber-400/80">
              ⚠ {selectedRole} tim ini sudah diisi oleh <strong>{replaceWarning}</strong> — akses mereka akan dicabut.
            </p>
          )}
        </Field>
      )}

      {selectedOrg && (selectedRole === "captain" || selectedRole === "member") && (
        <Field label={`${inGameRoleNum}. Pilih Role In-Game (opsional)`} name="main_role">
          <CustomSelect
            value={selectedInGameRole}
            onChange={setSelectedInGameRole}
            fullWidth
            placeholder="Tanpa role in-game"
            options={[
              { value: "", label: "Tanpa role in-game" },
              ...availableInGameRoles.map((r) => ({
                value: r.value,
                label: r.label,
              })),
            ]}
          />
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
        className="inline-flex h-9 items-center gap-2 rounded border border-ui-border bg-ui-elevated px-4 text-xs font-medium text-ui-text transition-all hover:bg-ui-border hover:border-[#3D3D3D] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
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
      <label htmlFor={name} className="text-xs text-ui-text-2">
        {label}
      </label>
      {children}
    </div>
  );
}
