import { BarChart3 } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
 
import { AnalyticsDashboard } from "@/features/analytics/components/AnalyticsDashboard";
import { DateRangeSelector } from "@/features/analytics/components/DateRangeSelector";
import { PatchSelector } from "@/features/analytics/components/PatchSelector";
import {
  getOverviewStats,
  getRecentScrims,
  getEnterprisePlayerStats,
  getDraftAnalytics,
  getTournamentAnalytics,
} from "@/features/analytics/queries";

import { getMetaPatches } from "@/features/meta/queries";
import { getOrgBySlug } from "@/features/teams/queries";
 
export const dynamic = "force-dynamic";
 
type RangeValue = "30d" | "3m" | "all";
 
function getStartDate(range: RangeValue): string | null {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  if (range === "30d") {
    now.setUTCDate(now.getUTCDate() - 30);
    return now.toISOString();
  }
  if (range === "3m") {
    now.setUTCMonth(now.getUTCMonth() - 3);
    return now.toISOString();
  }
  return null;
}
 
interface AnalyticsPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ range?: string; patchId?: string }>;
}
 
const AnalyticsPage = async ({ params, searchParams }: AnalyticsPageProps) => {
  const { "team-slug": slug } = await params;
  const { range: rawRange, patchId: rawPatchId } = await searchParams;
 
  const range: RangeValue = rawRange === "30d" || rawRange === "3m" ? rawRange : "all";
  const startDate = getStartDate(range);
 
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();
 
  // Fetch patches to filter by
  const patches = await getMetaPatches(organization.id);
  const activePatch = patches.find((p) => p.is_active);
  const selectedPatchId = rawPatchId ?? activePatch?.id ?? null;
 
  const [{ stats, formatBreakdown }, recentScrims, playerStats, draftData, tournamentData] =
    await Promise.all([
      getOverviewStats(organization.id, startDate, selectedPatchId),
      getRecentScrims(organization.id, startDate, selectedPatchId),
      getEnterprisePlayerStats(organization.id, selectedPatchId),
      getDraftAnalytics(organization.id, selectedPatchId),
      getTournamentAnalytics(organization.id),
    ]);
 
  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ui-elevated">
            <BarChart3 className="h-4 w-4 text-ui-text-2" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ui-text sm:text-3xl">Analytics</h1>
            <p className="text-xs text-ui-text-muted">Statistik dan performa tim</p>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 w-full sm:w-72">
          <Suspense>
            <DateRangeSelector activeRange={range} />
          </Suspense>
          {patches.length > 0 && selectedPatchId && (
            <Suspense>
              <PatchSelector activePatchId={selectedPatchId} patches={patches} />
            </Suspense>
          )}
        </div>
      </header>
 
      <AnalyticsDashboard
        overviewStats={stats}
        formatBreakdown={formatBreakdown}
        recentScrims={recentScrims}
        playerStats={playerStats}
        draftData={draftData}
        tournamentData={tournamentData}
        orgId={organization.id}
        slug={slug}
        patchId={selectedPatchId}
        startDate={startDate}
      />
    </div>
  );
};
 
export default AnalyticsPage;
