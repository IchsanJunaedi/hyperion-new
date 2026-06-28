import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listFinances, getFinanceSummary } from "@/features/finances/queries";
import { FinancePageClient } from "@/features/finances/components/FinancePageClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}

const ManageFinancesPage = async ({ params, searchParams }: Props) => {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year ?? now.getFullYear());
  const month = Number(sp.month ?? now.getMonth() + 1);

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const rows = await listFinances(org.id, year, month);
  const summary = await getFinanceSummary(org.id, year, month, rows);

  return (
    <div className="space-y-6">
      <FinancePageClient
        orgId={org.id}
        rows={rows}
        summary={summary}
        year={year}
        month={month}
        canDelete={true}
        revalidatePaths={[
          `/manage/${orgSlug}/finances`,
          "/dashboard/finances",
          "/dashboard",
        ]}
      />
    </div>
  );
};
export default ManageFinancesPage;
