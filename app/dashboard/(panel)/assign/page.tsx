import Link from "next/link";
import { Plus } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { AssignRoleForm } from "@/features/dashboard/components/AssignRoleForm";

export const dynamic = "force-dynamic";

export default async function AssignRolePage() {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, username, display_name, email")
    .order("full_name", { ascending: true });

  const { data: allActiveMembers } = await admin
    .from("team_members")
    .select("user_id, organization_id, role")
    .eq("is_active", true);

  const ownerEmail = process.env.OWNER_EMAIL;
  // Exclude only the owner — everyone else can be assigned to any org they're not yet in
  const filteredProfiles = (profiles ?? []).filter(
    (p) => p.email !== ownerEmail,
  );

  // org_id → user_ids already active in that org (for per-org filtering in the form)
  const orgAssignedUserIds: Record<string, string[]> = {};
  for (const m of allActiveMembers ?? []) {
    if (!m.organization_id) continue;
    if (!orgAssignedUserIds[m.organization_id]) orgAssignedUserIds[m.organization_id] = [];
    orgAssignedUserIds[m.organization_id]!.push(m.user_id);
  }

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, slug")
    .order("name", { ascending: true });

  const { data: divisions } = await admin
    .from("divisions")
    .select("id, organization_id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Determine which roles are already filled per org (manager, captain, coach = max 1 each)
  const orgFilledRoles: Record<string, string[]> = {};
  for (const m of allActiveMembers ?? []) {
    if (m.organization_id && ["manager", "captain", "coach"].includes(m.role)) {
      const orgId = m.organization_id;
      if (!orgFilledRoles[orgId]) orgFilledRoles[orgId] = [];
      const roles = orgFilledRoles[orgId]!; // Use non-null assertion or local var
      if (!roles.includes(m.role)) {
        roles.push(m.role);
      }
    }
  }

  return (
    <>
      <main className="flex-1 max-w-[600px] w-full mx-auto px-8 py-12">
        <div className="mb-8">
          <Plus className="h-8 w-8 text-[#9B9A97] mb-3" />
          <h1 className="font-bold text-[28px] text-[#E5E2E1]">Assign Role</h1>
          <p className="text-[#9B9A97] mt-1 text-sm">
            Tambahkan user ke tim dan assign role. Owner tidak ditampilkan.
          </p>
        </div>

        <AssignRoleForm
          users={filteredProfiles.map((p) => ({
            id: p.id,
            label: p.full_name ?? p.display_name ?? p.username ?? p.id,
          }))}
          organizations={(orgs ?? []).map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
          }))}
          divisions={(divisions ?? [])
            .filter((d) => !!d.organization_id)
            .map((d) => ({
              id: d.id,
              organizationId: d.organization_id as string,
              name: d.name,
            }))}
          orgFilledRoles={orgFilledRoles}
          orgAssignedUserIds={orgAssignedUserIds}
        />
      </main>
    </>
  );
}
