import { redirect } from "next/navigation";

import { SalaryPageClient } from "@/features/salary/components/SalaryPageClient";
import { listContracts, getPayrollSummary } from "@/features/salary/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ManageSalariesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/salaries");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/manage");

  const orgId = membership.organization_id;

  const [contracts, summary, membersRes] = await Promise.all([
    listContracts(orgId),
    getPayrollSummary(orgId),
    admin
      .from("team_members")
      .select("user_id, role")
      .eq("organization_id", orgId)
      .eq("is_active", true),
  ]);

  const memberRows = membersRes.data ?? [];
  const userIds = memberRows.map((m) => m.user_id);
  const { data: profileRows } = userIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p.display_name]));
  const members = memberRows
    .filter((m) => m.role !== "owner" && m.user_id !== user.id)
    .map((m) => ({
      user_id: m.user_id,
      display_name: profileMap.get(m.user_id) ?? null,
      role: m.role,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Salary Player</h1>
        <p className="mt-1 text-sm text-[#9B9A97]">
          Kelola kontrak, gaji bulanan, dan riwayat pembayaran tiap player.
        </p>
      </div>

      <SalaryPageClient
        orgId={orgId}
        contracts={contracts}
        summary={summary}
        members={members}
        revalidatePaths={["/manage/salaries", "/dashboard/salaries"]}
      />
    </div>
  );
}
