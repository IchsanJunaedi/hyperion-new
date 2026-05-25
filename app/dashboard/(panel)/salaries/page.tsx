import Link from "next/link";
import { redirect } from "next/navigation";

import { SalaryPageClient } from "@/features/salary/components/SalaryPageClient";
import { listContracts, getPayrollSummary } from "@/features/salary/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface SearchParams {
  org?: string;
}

export default async function DashboardSalariesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/");

  const sp = await searchParams;
  const admin = createAdminClient();

  const { data: orgs } = await admin.from("organizations").select("id, name").order("created_at");
  const orgId = sp.org ?? orgs?.[0]?.id ?? null;
  if (!orgId) redirect("/dashboard");

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
  const members = memberRows.map((m) => ({
    user_id: m.user_id,
    display_name: profileMap.get(m.user_id) ?? null,
    role: m.role,
  }));

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">
            Home
          </Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">Salary Player</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-8 py-10 space-y-6">
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
          revalidatePaths={["/dashboard/salaries", "/manage/salaries"]}
        />
      </main>
    </>
  );
}
