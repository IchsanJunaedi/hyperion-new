import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMonthlyReport } from "@/features/reports/queries";
import { ReportView } from "@/features/reports/components/ReportView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}

const ManageReportsPage = async ({ params, searchParams }: Props) => {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;

  const report = await generateMonthlyReport(org.id, year, month, "manager");

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][i],
  }));

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-bold text-[#E5E2E1]">Laporan Bulanan</h1>
        </div>
        <p className="text-sm text-[#9B9A97] mt-1">
          Ringkasan performa tim per bulan.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1">
        {months.map((m) => {
          const active = m.value === month;
          return (
            <a
              key={m.value}
              href={`/manage/${orgSlug}/reports?year=${year}&month=${m.value}`}
              className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
                active
                  ? "bg-white text-black"
                  : "bg-[#202020] text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#E5E2E1]"
              }`}
            >
              {m.label}
            </a>
          );
        })}
      </nav>

      <ReportView report={report} />
    </div>
  );
};
export default ManageReportsPage;
