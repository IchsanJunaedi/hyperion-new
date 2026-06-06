import { createAdminClient } from "@/lib/supabase/admin";
import { ManagerDivisionList } from "@/features/dashboard/components/ManagerDivisionList";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageDivisionsPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return null;

  const [divsRes, membersRes] = await Promise.all([
    admin
      .from("divisions")
      .select("id, name, organization_id, is_active")
      .eq("organization_id", org.id)
      .order("name", { ascending: true }),
    admin
      .from("team_members")
      .select("division_id")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .limit(200),
  ]);

  const divMemberCount = new Map<string, number>();
  for (const m of membersRes.data ?? []) {
    if (m.division_id) {
      divMemberCount.set(m.division_id, (divMemberCount.get(m.division_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Edit Divisi</h1>
        <p className="mt-1 text-sm text-white/60">
          Lihat divisi dan jumlah member di masing-masing divisi.
        </p>
      </header>

      <ManagerDivisionList
        divisions={(divsRes.data ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          isActive: d.is_active,
          memberCount: divMemberCount.get(d.id) ?? 0,
        }))}
      />
    </div>
  );
};
export default ManageDivisionsPage;
