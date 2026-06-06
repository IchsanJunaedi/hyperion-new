import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { listPlayerTargets } from "@/features/player-development/queries";
import { PlayerDevelopmentClient } from "@/features/player-development/components/PlayerDevelopmentClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManagePlayerDevelopmentPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const [targets, membersRes] = await Promise.all([
    listPlayerTargets(org.id),
    admin
      .from("team_members")
      .select("user_id")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .limit(100),
  ]);

  const memberIds = (membersRes.data ?? []).map((m) => m.user_id);
  const { data: profiles } = memberIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", memberIds)
    : { data: [] };

  const memberList = (profiles ?? []).map((p) => ({
    user_id: p.id,
    display_name: p.display_name,
  }));

  const grouped = new Map<string, typeof targets>();
  for (const t of targets) {
    const arr = grouped.get(t.user_id) ?? [];
    arr.push(t);
    grouped.set(t.user_id, arr);
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold text-[#E5E2E1]">Player Development</h1>
        </div>
        <p className="text-sm text-[#9B9A97] mt-1">
          Track skill dan perkembangan setiap player.
        </p>
      </header>

      <PlayerDevelopmentClient
        targets={targets}
        orgSlug={orgSlug}
        members={memberList}
        grouped={Object.fromEntries(grouped)}
      />
    </div>
  );
};
export default ManagePlayerDevelopmentPage;
