import Link from "next/link";
import { redirect } from "next/navigation";

import { SalaryPageClient } from "@/features/salary/components/SalaryPageClient";
import { listContracts, getPayrollSummary } from "@/features/salary/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DashboardSalariesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();

  const { data: orgs } = await admin.from("organizations").select("id, name").order("created_at");
  if (!orgs || orgs.length === 0) redirect("/dashboard");
  const orgIds = orgs.map((o) => o.id);

  const [contracts, summary, membersRes] = await Promise.all([
    listContracts(orgIds),
    getPayrollSummary(orgIds),
    admin
      .from("team_members")
      .select("user_id, role, organization_id")
      .in("organization_id", orgIds)
      .eq("is_active", true),
  ]);

  const memberRows = membersRes.data ?? [];
  const userIds = memberRows.map((m) => m.user_id);
  const { data: profileRows } = userIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p.display_name]));
  const orgNameMap = new Map(orgs.map((o) => [o.id, o.name]));
  const members = memberRows.map((m) => ({
    user_id: m.user_id,
    display_name: profileMap.get(m.user_id) ?? null,
    role: m.role,
    organization_id: m.organization_id,
    org_name: orgNameMap.get(m.organization_id) ?? null,
  }));

  return (
    <>
      <main className="flex-1 max-w-5xl w-full mx-auto px-8 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Salary Player</h1>
          <p className="mt-1 text-sm text-[#9B9A97]">
            Kelola kontrak, gaji bulanan, dan riwayat pembayaran tiap player.
          </p>
        </div>

        <SalaryPageClient
          orgs={orgs}
          contracts={contracts}
          summary={summary}
          members={members}
          revalidatePaths={["/dashboard/salaries", "/manage/salaries"]}
        />
      </main>
    </>
  );
}
