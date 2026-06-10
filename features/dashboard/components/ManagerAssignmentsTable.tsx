"use client";

import { useState } from "react";

import { OrgDetailModal, type OrgDetail } from "./OrgDetailModal";

interface ManagerAssignmentsTableProps {
  members: Array<{
    id: string;
    user_id: string;
    organization_id: string;
    role: string;
    is_active: boolean;
  }>;
  profiles: Array<{
    id: string;
    full_name: string | null;
    username: string | null;
    display_name: string | null;
  }>;
  orgs: Array<{
    id: string;
    name: string;
    slug: string;
    tier: string | null;
  }>;
  allDivisions: Array<{ id: string; name: string; organization_id: string }>;
}

const ManagerAssignmentsTable = ({
  members,
  profiles,
  orgs,
  allDivisions,
}: ManagerAssignmentsTableProps) => {
  const [selectedOrg, setSelectedOrg] = useState<OrgDetail | null>(null);

  const managers = members.filter((m) => m.role === "manager" && m.is_active);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const orgMap = new Map(orgs.map((o) => [o.id, o]));

  function buildOrgDetail(orgId: string): OrgDetail | null {
    const org = orgMap.get(orgId);
    if (!org) return null;
    const divisions = allDivisions
      .filter((d) => d.organization_id === orgId)
      .map((d) => ({ id: d.id, name: d.name }));
    const memberCount = members.filter(
      (m) => m.organization_id === orgId && m.is_active,
    ).length;
    return { id: org.id, name: org.name, slug: org.slug, tier: org.tier, divisions, memberCount };
  }

  if (managers.length === 0) {
    return (
      <p className="rounded-lg border border-ui-border bg-white/[0.02] px-4 py-6 text-center text-sm text-ui-text-muted">
        Belum ada Manager yang di-assign. Gunakan &quot;Assign Role&quot; untuk menambahkan.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-ui-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ui-border bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">
                Manager
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">
                Tim
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-ui-text-2">
                Divisi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border">
            {managers.map((m) => {
              const p = profileMap.get(m.user_id);
              const org = orgMap.get(m.organization_id);
              const orgDivisions = allDivisions.filter(
                (d) => d.organization_id === m.organization_id,
              );
              return (
                <tr key={m.id} className="transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-ui-text">
                    {p?.full_name ?? p?.display_name ?? p?.username ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {org ? (
                      <button
                        type="button"
                        onClick={() => setSelectedOrg(buildOrgDetail(org.id))}
                        className="text-yellow-400 hover:underline cursor-pointer"
                      >
                        {org.name}
                      </button>
                    ) : (
                      <span className="text-ui-text-2">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ui-text-2">
                    {orgDivisions.length > 0
                      ? orgDivisions.map((d) => d.name).join(", ")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <OrgDetailModal
        org={selectedOrg}
        onClose={() => setSelectedOrg(null)}
      />
    </>
  );
};
export { ManagerAssignmentsTable };
