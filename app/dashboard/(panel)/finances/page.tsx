import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listFinances, getFinanceSummary } from "@/features/finances/queries";
import { FinancePageClient } from "@/features/finances/components/FinancePageClient";
import { OrgSwitcher } from "@/features/finances/components/OrgSwitcher";

export const dynamic = "force-dynamic";

interface FinancesPageProps {
  searchParams: Promise<{ year?: string; month?: string; org?: string }>;
}

export default async function DashboardFinancesPage({ searchParams }: FinancesPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/");

  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year ?? now.getFullYear());
  const month = Number(sp.month ?? now.getMonth() + 1);

  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id, full_name");
  const workspaceName = profiles?.find(p => p.id === user.id)?.full_name ?? "Hyperion Team";

  const { data: orgs } = await admin.from("organizations").select("id, name").eq("owner_id", user.id).order("created_at");
  const orgId = sp.org ?? orgs?.[0]?.id ?? null;
  if (!orgId) redirect("/dashboard");

  const rows = await listFinances(orgId, year, month);
  const summary = await getFinanceSummary(orgId, year, month, rows);

  return (
    <>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-10 space-y-6">
        {orgs && orgs.length > 1 && (
          <OrgSwitcher
            orgs={orgs}
            currentOrgId={orgId}
            basePath="/dashboard/finances"
            year={year}
            month={month}
          />
        )}
        <FinancePageClient
          orgId={orgId}
          rows={rows}
          summary={summary}
          year={year}
          month={month}
          canDelete={true}
          revalidatePaths={["/dashboard/finances", "/dashboard"]}
        />
      </main>
    </>
  );
}
