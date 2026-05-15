import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listFinances, summarizeFinances } from "@/features/finances/queries";
import { FinancePageClient } from "@/features/finances/components/FinancePageClient";

export const dynamic = "force-dynamic";

interface FinancesPageProps {
  searchParams: Promise<{ year?: string; month?: string; org?: string }>;
}

export default async function DashboardFinancesPage({ searchParams }: FinancesPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/finances");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/dashboard");

  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year ?? now.getFullYear());
  const month = Number(sp.month ?? now.getMonth() + 1);

  const admin = createAdminClient();
  const { data: orgs } = await admin.from("organizations").select("id, name").order("created_at");
  const orgId = sp.org ?? orgs?.[0]?.id ?? null;
  if (!orgId) redirect("/dashboard");

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
        revalidatePaths={["/dashboard/finances"]}
      />
    </div>
  );
}
