import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SalaryPageClient } from "@/features/salary/components/SalaryPageClient";
import { listContracts, getPayrollSummary } from "@/features/salary/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageSalariesPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/manage/${orgSlug}/salaries`);

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const [contracts, summary, membersRes] = await Promise.all([
    listContracts(org.id),
    getPayrollSummary(org.id),
    admin
      .from("team_members")
      .select("user_id, role")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .limit(100),
  ]);

  const memberRows = membersRes.data ?? [];
  const userIds = memberRows.map((m) => m.user_id);
  const { data: profileRows } = userIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profileRows ?? []).map((p) => [p.id, p.display_name])
  );
  const members = memberRows
    .filter((m) => m.role !== "owner" && m.user_id !== user.id)
    .map((m) => ({
      user_id: m.user_id,
      display_name: profileMap.get(m.user_id) ?? null,
      role: m.role,
      organization_id: org.id,
      org_name: org.name,
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
        orgs={[{ id: org.id, name: org.name }]}
        contracts={contracts}
        summary={summary}
        members={members}
        revalidatePaths={[
          `/manage/${orgSlug}/salaries`,
          "/dashboard/salaries",
        ]}
      />
    </div>
  );
};
export default ManageSalariesPage;
