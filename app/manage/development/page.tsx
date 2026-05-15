import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listPlayerTargets } from "@/features/player-development/queries";
import { PlayerDevelopmentClient } from "@/features/player-development/components/PlayerDevelopmentClient";

export const dynamic = "force-dynamic";

export default async function PlayerDevelopmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/development");

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwnerByEmail = ownerEmail && user.email === ownerEmail;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", ["manager", "owner", "coach"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership && !isOwnerByEmail) redirect("/");

  // Get org info
  const orgId = membership?.organization_id;
  if (!orgId) redirect("/");

  const { data: org } = await admin
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .maybeSingle();

  const orgSlug = org?.slug ?? "";

  // Get targets
  const targets = await listPlayerTargets(orgId);

  // Get members for the form
  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", memberIds);

  const memberList = (profiles ?? []).map((p) => ({
    user_id: p.id,
    display_name: p.display_name,
  }));

  // Group targets by player
  const grouped = new Map<string, typeof targets>();
  for (const t of targets) {
    const key = t.user_id;
    const arr = grouped.get(key) ?? [];
    arr.push(t);
    grouped.set(key, arr);
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
}
