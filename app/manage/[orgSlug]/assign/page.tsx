import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManagerAssignForm } from "@/features/dashboard/components/ManagerAssignForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageAssignPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return null;

  const ownerEmail = process.env.OWNER_EMAIL;

  const [profilesRes, divsRes, captainsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, username, display_name, email")
      .order("full_name", { ascending: true })
      .limit(500),
    admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
    admin
      .from("team_members")
      .select("organization_id")
      .eq("organization_id", org.id)
      .eq("role", "captain")
      .eq("is_active", true)
      .limit(1),
  ]);

  const filteredProfiles = (profilesRes.data ?? []).filter(
    (p) => p.email !== ownerEmail
  );

  const orgHasCaptain: Record<string, boolean> = {};
  if ((captainsRes.data ?? []).length > 0) {
    orgHasCaptain[org.id] = true;
  }

  void user;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Tambah Member</h1>
        <p className="mt-1 text-sm text-white/60">
          Assign user sebagai Captain atau Member di {org.name}.
        </p>
      </header>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <ManagerAssignForm
          users={filteredProfiles.map((p) => ({
            id: p.id,
            label: p.full_name ?? p.display_name ?? p.username ?? p.id,
          }))}
          organizations={[{ id: org.id, name: org.name, slug: org.slug }]}
          divisions={(divsRes.data ?? []).map((d) => ({
            id: d.id,
            organizationId: org.id,
            name: d.name,
          }))}
          orgHasCaptain={orgHasCaptain}
        />
      </div>
    </div>
  );
};
export default ManageAssignPage;
