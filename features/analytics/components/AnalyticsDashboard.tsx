"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { OverviewTab } from "./tabs/OverviewTab";
import { DraftAnalyticsTab } from "./tabs/DraftAnalyticsTab";
import { PlayerStatsTab } from "./tabs/PlayerStatsTab";
import { StatisticsTab } from "./tabs/StatisticsTab";
import { OpponentTab } from "./tabs/OpponentTab";
import { TournamentOverviewTab } from "./tabs/TournamentOverviewTab";
import type {
  OverviewStats,
  FormatStat,
  RecentScrim,
  EnterprisePlayerStat,
  DraftAnalyticsData,
  TournamentAnalyticsData,
  DraftDataSource,
} from "@/features/analytics/queries";

type TabKey = "overview" | "statistics" | "draft" | "players" | "opponents";
type DataSource = "all" | "scrim" | "tournament";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview",   label: "Overview" },
  { key: "statistics", label: "Statistics" },
  { key: "draft",      label: "Draft Analytics" },
  { key: "players",    label: "Player Stats" },
  { key: "opponents",  label: "Lawan" },
];

const DATA_SOURCE_OPTIONS: Array<{ value: DataSource; label: string }> = [
  { value: "all",        label: "Semua" },
  { value: "scrim",      label: "Scrim" },
  { value: "tournament", label: "Turnamen" },
];

interface AnalyticsDashboardProps {
  overviewStats: OverviewStats;
  formatBreakdown: FormatStat[];
  recentScrims: RecentScrim[];
  playerStats: EnterprisePlayerStat[];
  draftData: DraftAnalyticsData;
  tournamentData: TournamentAnalyticsData;
  orgId: string;
  slug: string;
  patchId?: string | null;
  startDate?: string | null;
}
 
const AnalyticsDashboard = ({
  overviewStats,
  formatBreakdown,
  recentScrims,
  playerStats,
  draftData,
  tournamentData,
  orgId,
  slug,
  patchId,
  startDate,
}: AnalyticsDashboardProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [dataSource, setDataSource] = useState<DataSource>("all");
 
  return (
    <div className="space-y-6">
      {/* Data source segment toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-ui-text-muted font-medium">Data:</span>
        <div className="inline-flex rounded-lg border border-ui-border bg-ui-surface p-0.5 gap-0.5">
          {DATA_SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDataSource(opt.value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                dataSource === opt.value
                  ? "bg-yellow-400 text-black"
                  : "text-ui-text-muted hover:text-ui-text",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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
      {activeTab === "overview" && dataSource === "tournament" ? (
        <TournamentOverviewTab data={tournamentData} />
      ) : activeTab === "overview" ? (
        <OverviewTab
          stats={overviewStats}
          formatBreakdown={formatBreakdown}
          recentScrims={recentScrims}
          slug={slug}
        />
      ) : null}
      {activeTab === "statistics" && (
        <StatisticsTab orgId={orgId} patchId={patchId} startDate={startDate} />
      )}
      {activeTab === "draft" && <DraftAnalyticsTab data={draftData} />}
      {activeTab === "players" && <PlayerStatsTab playerStats={playerStats} orgId={orgId} />}
      {activeTab === "opponents" && <OpponentTab orgId={orgId} patchId={patchId} />}
    </div>
  );
};
export { AnalyticsDashboard };
