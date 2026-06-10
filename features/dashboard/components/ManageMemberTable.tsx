"use client";

import { useState } from "react";

import { AvailabilityBadge } from "@/features/roster/components/AvailabilityBadge";
import { MainRoleBadge, MainRoleSelector } from "@/features/roster/components/MainRoleSelector";
import type { MainRole } from "@/features/roster/actions/updateMainRole";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { UserDetailModal, type UserDetail } from "./UserDetailModal";

interface ManageMember {
  id: string;
  userId: string;
  fullName: string | null;
  username: string | null;
  email: string | null;
  phoneWa: string | null;
  dateOfBirth: string | null;
  bio: string | null;
  socialLinks: Record<string, string> | null;
  gameIds: Record<string, string> | null;
  role: string;
  division: string | null;
  orgName: string | null;
  orgSlug: string;
  availability: "active" | "hiatus" | "unavailable";
  mainRole: string | null;
}

interface ManageMemberTableProps {
  members: ManageMember[];
  orgName: string;
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: "bg-yellow-500/10 text-yellow-400",
    manager: "bg-green-500/10 text-green-400",
    coach: "bg-blue-500/10 text-blue-400",
    captain: "bg-purple-500/10 text-purple-400",
    member: "bg-ui-elevated text-ui-text-2",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[role] ?? colors.member}`}>
      {role}
    </span>
  );
}

const ManageMemberTable = ({ members, orgName }: ManageMemberTableProps) => {
  const [selected, setSelected] = useState<UserDetail | null>(null);

  return (
    <>
      <div className="overflow-x-auto md:overflow-visible sidebar-scroll rounded-lg border border-ui-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ui-border bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">Username</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">Divisi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">Role Ingame</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">WA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-ui-text-2">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border">
            {members.map((m, idx) => (
              <tr key={m.id} className="transition hover:bg-white/[0.04]">
                <td
                  className="px-4 py-3 text-ui-text cursor-pointer hover:text-yellow-400"
                  onClick={() =>
                    setSelected({
                      id: m.userId,
                      fullName: m.fullName,
                      username: m.username,
                      email: m.email,
                      phoneWa: m.phoneWa,
                      dateOfBirth: m.dateOfBirth,
                      bio: m.bio,
                      socialLinks: m.socialLinks,
                      gameIds: m.gameIds,
                      role: m.role,
                      division: m.division,
                      orgName: m.orgName,
                    })
                  }
                >
                  {m.fullName ?? "—"}
                </td>
                <td className="px-4 py-3 text-ui-text-2">{m.username ?? "—"}</td>
                <td className="px-4 py-3 text-ui-text-2">{m.division ?? "—"}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={m.role} />
                </td>
                <td className="px-4 py-3">
                  {(m.role === "captain" || m.role === "member") ? (
                    <MainRoleSelector
                      orgSlug={m.orgSlug}
                      memberId={m.id}
                      currentMainRole={m.mainRole as MainRole}
                      direction={idx >= members.length - 2 && idx > 0 ? "up" : "down"}
                    />
                  ) : (
                    <MainRoleBadge mainRole={null} />
                  )}
                </td>
                <td className="px-4 py-3 text-ui-text-2">{m.phoneWa ?? "—"}</td>
                <td className="px-4 py-3"><AvailabilityBadge availability={m.availability} /></td>
                <td className="px-4 py-3 text-right">
                  {m.role !== "owner" && m.role !== "manager" && (
                    <RemoveMemberButton memberId={m.id} name={m.fullName ?? "member"} />
                  )}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-ui-text-muted">
                  Belum ada member di tim ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <UserDetailModal user={selected} onClose={() => setSelected(null)} />
    </>
  );
};
export { ManageMemberTable };
