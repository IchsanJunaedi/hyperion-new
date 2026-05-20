import { BarChart3 } from "lucide-react";
import { notFound } from "next/navigation";

import { AnalyticsDashboard } from "@/features/analytics/components/AnalyticsDashboard";
import {
  getOverviewStats,
  getRecentScrims,
  getEnterprisePlayerStats,
  getDraftAnalytics,
} from "@/features/analytics/queries";
import { getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface AnalyticsPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const [{ stats, formatBreakdown }, recentScrims, playerStats, draftData] =
    await Promise.all([
      getOverviewStats(organization.id),
      getRecentScrims(organization.id),
      getEnterprisePlayerStats(organization.id),
      getDraftAnalytics(organization.id),
    ]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#252525]">
          <BarChart3 className="h-4 w-4 text-[#9B9A97]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Analytics</h1>
          <p className="text-xs text-[#6B6A68]">Statistik dan performa tim</p>
        </div>
      </header>

      <AnalyticsDashboard
        overviewStats={stats}
        formatBreakdown={formatBreakdown}
        recentScrims={recentScrims}
        playerStats={playerStats}
        draftData={draftData}
      />
    </div>
  );
}
