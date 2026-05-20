"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { OverviewTab } from "./tabs/OverviewTab";
import { DraftAnalyticsTab } from "./tabs/DraftAnalyticsTab";
import { PlayerStatsTab } from "./tabs/PlayerStatsTab";
import { AIInsightsTab } from "./tabs/AIInsightsTab";
import type {
  OverviewStats,
  FormatStat,
  RecentScrim,
  EnterprisePlayerStat,
  DraftAnalyticsData,
} from "@/features/analytics/queries";

type TabKey = "overview" | "draft" | "players" | "ai";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "draft", label: "Draft Analytics" },
  { key: "players", label: "Player Stats" },
  { key: "ai", label: "AI Insights" },
];

interface AnalyticsDashboardProps {
  overviewStats: OverviewStats;
  formatBreakdown: FormatStat[];
  recentScrims: RecentScrim[];
  playerStats: EnterprisePlayerStat[];
  draftData: DraftAnalyticsData;
}

export function AnalyticsDashboard({
  overviewStats,
  formatBreakdown,
  recentScrims,
  playerStats,
  draftData,
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <nav className="flex gap-1 border-b border-[#2D2D2D]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "relative mr-5 cursor-pointer pb-3 px-1 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-yellow-400 after:content-['']"
                : "text-white/40 hover:text-white/70",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          stats={overviewStats}
          formatBreakdown={formatBreakdown}
          recentScrims={recentScrims}
        />
      )}
      {activeTab === "draft" && <DraftAnalyticsTab data={draftData} />}
      {activeTab === "players" && <PlayerStatsTab playerStats={playerStats} />}
      {activeTab === "ai" && <AIInsightsTab />}
    </div>
  );
}
