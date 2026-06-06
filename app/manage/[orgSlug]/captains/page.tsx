import { createAdminClient } from "@/lib/supabase/admin";
import { CaptainList } from "@/features/dashboard/components/CaptainList";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageCaptainsPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return null;

  const [captainsRes, divsRes] = await Promise.all([
    admin
      .from("team_members")
      .select("id, user_id, division_id, role")
      .eq("organization_id", org.id)
      .eq("role", "captain")
      .eq("is_active", true)
      .limit(50),
    admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true),
  ]);

  const captains = captainsRes.data ?? [];
  const captainUserIds = [...new Set(captains.map((c) => c.user_id))];
  const { data: profiles } = captainUserIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, full_name, username, display_name")
        .in("id", captainUserIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const divisionMap = new Map((divsRes.data ?? []).map((d) => [d.id, d]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Edit Captain</h1>
        <p className="mt-1 text-sm text-white/60">
          Lihat dan kelola captain di tim kamu.
        </p>
      </header>

      <CaptainList
        captains={captains.map((c) => {
          const p = profileMap.get(c.user_id);
          const div = c.division_id ? divisionMap.get(c.division_id) : null;
          return {
            memberId: c.id,
            name: p?.full_name ?? p?.display_name ?? p?.username ?? "—",
            division: div?.name ?? "—",
          };
        })}
      />
    </div>
  );
};
export default ManageCaptainsPage;
