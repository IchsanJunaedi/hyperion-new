import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManagerDivisionList } from "@/features/dashboard/components/ManagerDivisionList";

export const dynamic = "force-dynamic";

export default async function ManageDivisionsPage() {
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

  // Get divisions for these orgs
  const { data: divisions } = orgIds.length > 0
    ? await admin
        .from("divisions")
        .select("id, name, organization_id, is_active")
        .in("organization_id", orgIds)
        .order("name", { ascending: true })
    : { data: [] };

  // Get members to show count per division
  const { data: members } = orgIds.length > 0
    ? await admin
        .from("team_members")
        .select("division_id")
        .in("organization_id", orgIds)
        .eq("is_active", true)
    : { data: [] };

  // Count members per division
  const divMemberCount = new Map<string, number>();
  for (const m of members ?? []) {
    if (m.division_id) {
      divMemberCount.set(m.division_id, (divMemberCount.get(m.division_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/manage" className="text-xs text-white/50 hover:text-white">← Manager Panel</Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Edit Divisi</h1>
        <p className="mt-1 text-sm text-white/60">
          Lihat divisi yang ada dan jumlah member di masing-masing divisi.
          Untuk menambah member ke divisi, gunakan "Tambah Member".
        </p>
      </header>

      <ManagerDivisionList
        divisions={(divisions ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          isActive: d.is_active,
          memberCount: divMemberCount.get(d.id) ?? 0,
        }))}
      />
    </div>
  );
}
