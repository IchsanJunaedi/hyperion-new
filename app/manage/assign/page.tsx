import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManagerAssignForm } from "@/features/dashboard/components/ManagerAssignForm";

export const dynamic = "force-dynamic";

export default async function ManagerAssignPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  // Get orgs this manager belongs to
  const { data: memberships } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user!.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true);

  const orgIds = [...new Set((memberships ?? []).map((m) => m.organization_id))];

  // Get all registered users
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, username, display_name, email")
    .order("full_name", { ascending: true });

  const ownerEmail = process.env.OWNER_EMAIL;

  // Filter out owner from the user list
  const filteredProfiles = (profiles ?? []).filter((p) => p.email !== ownerEmail);

  // Get orgs
  const { data: orgs } = orgIds.length > 0
    ? await admin.from("organizations").select("id, name, slug").in("id", orgIds)
    : { data: [] };

  // Get divisions
  const { data: divisions } = orgIds.length > 0
    ? await admin.from("divisions").select("id, organization_id, name").in("organization_id", orgIds).eq("is_active", true).order("name", { ascending: true })
    : { data: [] };

  // Get existing captains per org
  const { data: captains } = orgIds.length > 0
    ? await admin.from("team_members").select("organization_id").in("organization_id", orgIds).eq("role", "captain").eq("is_active", true)
    : { data: [] };

  const orgHasCaptain: Record<string, boolean> = {};
  for (const c of captains ?? []) {
    orgHasCaptain[c.organization_id] = true;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Tambah Member</h1>
        <p className="mt-1 text-sm text-white/60">
          Assign user sebagai Captain atau Member di tim kamu. Owner tidak ditampilkan karena sudah ada di semua tim.
        </p>
      </header>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <ManagerAssignForm
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
            organizationId: d.organization_id ?? "",
            name: d.name,
          }))}
          orgHasCaptain={orgHasCaptain}
        />
      </div>
    </div>
  );
}
