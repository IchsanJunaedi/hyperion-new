"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { OverviewTab } from "./tabs/OverviewTab";
import { DraftAnalyticsTab } from "./tabs/DraftAnalyticsTab";
import { PlayerStatsTab } from "./tabs/PlayerStatsTab";
import { StatisticsTab } from "./tabs/StatisticsTab";
import { OpponentTab } from "./tabs/OpponentTab";
import type {
  OverviewStats,
  FormatStat,
  RecentScrim,
  EnterprisePlayerStat,
  DraftAnalyticsData,
} from "@/features/analytics/queries";

type TabKey = "overview" | "statistics" | "draft" | "players" | "opponents";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview",   label: "Overview" },
  { key: "statistics", label: "Statistics" },
  { key: "draft",      label: "Draft Analytics" },
  { key: "players",    label: "Player Stats" },
  { key: "opponents",  label: "Lawan" },
];

interface AnalyticsDashboardProps {
  overviewStats: OverviewStats;
  formatBreakdown: FormatStat[];
  recentScrims: RecentScrim[];
  playerStats: EnterprisePlayerStat[];
  draftData: DraftAnalyticsData;
  orgId: string;
  slug: string;
  patchId?: string | null;
}
 
const AnalyticsDashboard = ({
  overviewStats,
  formatBreakdown,
  recentScrims,
  playerStats,
  draftData,
  orgId,
  slug,
  patchId,
}: AnalyticsDashboardProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="print-hide flex items-center justify-between gap-2 border-b border-ui-border">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative mr-5 cursor-pointer pb-3 px-1 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "text-ui-text after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-yellow-400 after:content-['']"
                  : "text-ui-text-muted hover:text-ui-text",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => window.print()}
          className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-ui-border px-3 py-1.5 text-xs text-ui-text-2 transition hover:bg-ui-elevated hover:text-ui-text cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Export PDF
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          stats={overviewStats}
          formatBreakdown={formatBreakdown}
          recentScrims={recentScrims}
          slug={slug}
        />
      )}
      {activeTab === "statistics" && <StatisticsTab orgId={orgId} patchId={patchId} />}
      {activeTab === "draft" && <DraftAnalyticsTab data={draftData} />}
      {activeTab === "players" && <PlayerStatsTab playerStats={playerStats} orgId={orgId} />}
      {activeTab === "opponents" && <OpponentTab orgId={orgId} patchId={patchId} />}
    </div>
  );
};
export { AnalyticsDashboard };
