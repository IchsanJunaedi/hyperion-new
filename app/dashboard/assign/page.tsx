import { createAdminClient } from "@/lib/supabase/admin";
import { AssignRoleForm } from "@/features/dashboard/components/AssignRoleForm";

export const dynamic = "force-dynamic";

export default async function AssignRolePage() {
  const admin = createAdminClient();

  // Get all users
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, username, display_name")
    .order("full_name", { ascending: true });

  // Get emails to identify and filter out owner
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

  // Get organizations
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, slug")
    .order("name", { ascending: true });

  const { data: divisions } = await admin
    .from("divisions")
    .select("id, organization_id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Determine which orgs already have a captain
  const { data: captains } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("role", "captain")
    .eq("is_active", true);

  const orgHasCaptain: Record<string, boolean> = {};
  for (const c of captains ?? []) {
    orgHasCaptain[c.organization_id] = true;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Assign Role</h1>
        <p className="mt-1 text-sm text-white/60">
          Tambahkan user ke tim dan assign role mereka. Owner tidak ditampilkan
          karena sudah ada di semua tim otomatis.
        </p>
      </header>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
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
          orgHasCaptain={orgHasCaptain}
        />
      </div>
    </div>
  );
}
