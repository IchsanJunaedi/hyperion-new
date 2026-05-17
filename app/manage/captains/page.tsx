import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CaptainList } from "@/features/dashboard/components/CaptainList";

export const dynamic = "force-dynamic";

export default async function ManageCaptainsPage() {
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

  // Get captains in these orgs
  const { data: captains } = orgIds.length > 0
    ? await admin
        .from("team_members")
        .select("id, user_id, organization_id, division_id, role")
        .in("organization_id", orgIds)
        .eq("role", "captain")
        .eq("is_active", true)
    : { data: [] };

  // Get profiles
  const captainUserIds = [...new Set((captains ?? []).map((c) => c.user_id))];
  const { data: profiles } = captainUserIds.length > 0
    ? await admin.from("profiles").select("id, full_name, username, display_name").in("id", captainUserIds)
    : { data: [] };

  // Get divisions
  const { data: divisions } = orgIds.length > 0
    ? await admin.from("divisions").select("id, name").in("organization_id", orgIds).eq("is_active", true)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const divisionMap = new Map((divisions ?? []).map((d) => [d.id, d]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Edit Captain</h1>
        <p className="mt-1 text-sm text-white/60">
          Lihat dan kelola captain di tim kamu. Untuk assign captain baru, gunakan "Tambah Member" dengan role Captain.
        </p>
      </header>

      <CaptainList
        captains={(captains ?? []).map((c) => {
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
}
