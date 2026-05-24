import { BarChart3 } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AnalyticsDashboard } from "@/features/analytics/components/AnalyticsDashboard";
import { DateRangeSelector } from "@/features/analytics/components/DateRangeSelector";
import {
  getOverviewStats,
  getRecentScrims,
  getEnterprisePlayerStats,
  getDraftAnalytics,
} from "@/features/analytics/queries";
import { getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

type RangeValue = "30d" | "3m" | "all";

function getStartDate(range: RangeValue): string | null {
  const now = new Date();
  if (range === "30d") {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }
  if (range === "3m") {
    now.setMonth(now.getMonth() - 3);
    return now.toISOString();
  }
  return null;
}

interface AnalyticsPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ range?: string }>;
}

export default async function AnalyticsPage({ params, searchParams }: AnalyticsPageProps) {
  const { "team-slug": slug } = await params;
  const { range: rawRange } = await searchParams;

  const range: RangeValue = rawRange === "30d" || rawRange === "3m" ? rawRange : "all";
  const startDate = getStartDate(range);

  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const [{ stats, formatBreakdown }, recentScrims, playerStats, draftData] =
    await Promise.all([
      getOverviewStats(organization.id, startDate),
      getRecentScrims(organization.id, startDate),
      getEnterprisePlayerStats(organization.id),
      getDraftAnalytics(organization.id),
    ]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#252525]">
            <BarChart3 className="h-4 w-4 text-[#9B9A97]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Analytics</h1>
            <p className="text-xs text-[#6B6A68]">Statistik dan performa tim</p>
          </div>
        </div>
        <Suspense>
          <DateRangeSelector activeRange={range} />
        </Suspense>
      </header>

      <AnalyticsDashboard
        overviewStats={stats}
        formatBreakdown={formatBreakdown}
        recentScrims={recentScrims}
        playerStats={playerStats}
        draftData={draftData}
        orgId={organization.id}
      />
    </div>
  );
}
