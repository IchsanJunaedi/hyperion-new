import Link from "next/link";
import { Plus } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { AssignRoleForm } from "@/features/dashboard/components/AssignRoleForm";

export const dynamic = "force-dynamic";

export default async function AssignRolePage() {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, username, display_name")
    .order("full_name", { ascending: true });

  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 500 });
  const emailMap = new Map<string, string>();
  for (const u of authUsers?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  const ownerEmail = process.env.OWNER_EMAIL;
  const filteredProfiles = (profiles ?? []).filter((p) => {
    const email = emailMap.get(p.id);
    return email !== ownerEmail;
  });

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
  const { data: allMembers } = await admin
    .from("team_members")
    .select("organization_id, role")
    .in("role", ["manager", "captain", "coach"])
    .eq("is_active", true);

  const orgFilledRoles: Record<string, string[]> = {};
  for (const m of allMembers ?? []) {
    if (!orgFilledRoles[m.organization_id]) orgFilledRoles[m.organization_id] = [];
    if (!orgFilledRoles[m.organization_id].includes(m.role)) {
      orgFilledRoles[m.organization_id].push(m.role);
    }
  }

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">Home</Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">Assign Role</span>
        </div>
      </header>

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
          divisions={(divisions ?? []).map((d) => ({
            id: d.id,
            organizationId: d.organization_id,
            name: d.name,
          }))}
          orgFilledRoles={orgFilledRoles}
        />
      </main>
    </>
  );
}
