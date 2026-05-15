"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { assignRoleAction } from "../actions";
import type { MemberRole } from "@/types/database";

interface AssignRoleFormProps {
  users: Array<{ id: string; label: string }>;
  organizations: Array<{ id: string; name: string; slug: string }>;
  divisions: Array<{ id: string; organizationId: string; name: string }>;
  orgHasCaptain: Record<string, boolean>;
}

const ALL_ROLES: Array<{ value: MemberRole; label: string }> = [
  { value: "manager", label: "Manager" },
  { value: "coach", label: "Coach" },
  { value: "captain", label: "Captain" },
  { value: "member", label: "Member" },
];

export function AssignRoleForm({
  users,
  organizations,
  divisions,
  orgHasCaptain,
}: AssignRoleFormProps) {
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

  const filteredDivisions = divisions.filter((d) => d.organizationId === selectedOrg);

  const availableRoles: Array<{ value: MemberRole; label: string }> = useMemo(() => {
    const hasCaptain = selectedOrg ? orgHasCaptain[selectedOrg] : false;
    if (hasCaptain) {
      return ALL_ROLES.filter((r) => r.value !== "captain");
    }
    return ALL_ROLES;
  }, [selectedOrg, orgHasCaptain]);

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
        toast.success("Role berhasil di-assign");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="1. Pilih User" name="user_id">
        <select
          name="user_id"
          required
          value={selectedUser}
          onChange={(e) => handleUserChange(e.target.value)}
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
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
            className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
          >
            <option value="" disabled>Pilih tim...</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </Field>
      )}

      {selectedOrg && filteredDivisions.length > 0 && (
        <Field label="3. Pilih Divisi (opsional)" name="division_id">
          <select
            name="division_id"
            value={selectedDiv}
            onChange={(e) => setSelectedDiv(e.target.value)}
            className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
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
            className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
          >
            <option value="" disabled>Pilih role...</option>
            {availableRoles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {orgHasCaptain[selectedOrg] && (
            <p className="mt-1 text-xs text-white/40">
              Tim ini sudah punya Captain.
            </p>
          )}
        </Field>
      )}

      {error && (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !selectedUser || !selectedOrg || !selectedRole}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-yellow-400 px-5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Assign Role
      </button>
    </form>
  );
}

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
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-white/70">
        {label}
      </label>
      {children}
    </div>
  );
}
