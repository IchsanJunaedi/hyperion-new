import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listFinances, summarizeFinances } from "@/features/finances/queries";
import { FinancePageClient } from "@/features/finances/components/FinancePageClient";

export const dynamic = "force-dynamic";

interface FinancesPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function ManageFinancesPage({ searchParams }: FinancesPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/finances");

  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year ?? now.getFullYear());
  const month = Number(sp.month ?? now.getMonth() + 1);

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
  const rows = await listFinances(orgId, year, month);
  const summary = summarizeFinances(rows);

  return (
    <div className="space-y-6">
      <FinancePageClient
        orgId={orgId}
        rows={rows}
        summary={summary}
        year={year}
        month={month}
        canDelete={true}
        revalidatePaths={["/manage/finances", "/dashboard/finances"]}
      />
    </div>
  );
}
