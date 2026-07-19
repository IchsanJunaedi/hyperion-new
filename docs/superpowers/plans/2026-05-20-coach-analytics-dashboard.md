# Coach Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setelah submit FinishScrimForm, redirect ke `/{orgSlug}/analytics` — halaman dashboard dengan 4 tab (Overview, Draft Analytics, Player Stats, AI Insights).

**Architecture:** Server Component page fetch semua data via `Promise.all`, pass ke `AnalyticsDashboard` client component yang handle tab switching dengan `useState`. Pure computation functions dipisah di `computations.ts` agar bisa di-unit-test.

**Tech Stack:** Next.js 15 App Router, Supabase (server client), Tailwind CSS v4, Lucide React, Sonner toast, Vitest.

---

## File Map

```
CREATE features/analytics/computations.ts          ← Pure math/aggregation functions
CREATE features/analytics/__tests__/computations.test.ts
CREATE features/analytics/queries.ts               ← Supabase fetches
CREATE features/analytics/components/tabs/DraftAnalyticsTab.tsx
CREATE features/analytics/components/tabs/AIInsightsTab.tsx
CREATE features/analytics/components/tabs/OverviewTab.tsx
CREATE features/analytics/components/tabs/PlayerStatsTab.tsx
CREATE features/analytics/components/AnalyticsDashboard.tsx
CREATE app/[team-slug]/(workspace)/analytics/page.tsx
MODIFY features/scrim/components/FinishScrimForm.tsx   ← ganti redirect + toast
```

---

## Task 1: Pure Computation Functions

**Files:**
- Create: `features/analytics/computations.ts`

- [ ] **Step 1.1: Buat `features/analytics/computations.ts`**

```typescript
// features/analytics/computations.ts

export interface RawScrimResult {
  scrim_id: string;
  format: string;
  is_win: boolean | null;
}

export interface RawAttendance {
  user_id: string;
  scrim_id: string;
  status: "confirmed" | "declined" | "tentative" | "pending";
}

export interface PlayerInfo {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  jersey_number: number | null;
  position: string | null;
}

export interface OverviewStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export interface FormatStat {
  format: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface PlayerStat extends PlayerInfo {
  attendanceRate: number;
  totalPresent: number;
  totalScrims: number;
  winRateWhenPresent: number;
  winsWhenPresent: number;
  scrimsWhenPresent: number;
  streak: number; // positive = hadir beruntun, negative = absen beruntun
}

export function computeOverviewStats(results: RawScrimResult[]): OverviewStats {
  const wins = results.filter((r) => r.is_win === true).length;
  const losses = results.filter((r) => r.is_win === false).length;
  const draws = results.filter((r) => r.is_win === null).length;
  const total = results.length;
  const winRate = total === 0 ? 0 : Math.round((wins / total) * 100);
  return { total, wins, losses, draws, winRate };
}

export function computeFormatBreakdown(results: RawScrimResult[]): FormatStat[] {
  const map = new Map<string, { wins: number; losses: number; total: number }>();
  for (const r of results) {
    const key = r.format.toLowerCase();
    const entry = map.get(key) ?? { wins: 0, losses: 0, total: 0 };
    entry.total++;
    if (r.is_win === true) entry.wins++;
    else if (r.is_win === false) entry.losses++;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([format, { wins, losses, total }]) => ({
      format,
      total,
      wins,
      losses,
      winRate: total === 0 ? 0 : Math.round((wins / total) * 100),
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * results harus diurutkan terbaru dulu (descending scheduled_at)
 * untuk kalkulasi streak yang benar.
 */
export function computePlayerStats(
  players: PlayerInfo[],
  attendances: RawAttendance[],
  results: RawScrimResult[],
): PlayerStat[] {
  const totalScrims = results.length;
  const resultByScrimId = new Map(results.map((r) => [r.scrim_id, r]));

  const attendancesByPlayer = new Map<string, RawAttendance[]>();
  for (const a of attendances) {
    const arr = attendancesByPlayer.get(a.user_id) ?? [];
    arr.push(a);
    attendancesByPlayer.set(a.user_id, arr);
  }

  const stats: PlayerStat[] = players.map((player) => {
    const playerAttendances = attendancesByPlayer.get(player.user_id) ?? [];
    const confirmed = playerAttendances.filter((a) => a.status === "confirmed");
    const totalPresent = confirmed.length;
    const attendanceRate =
      totalScrims === 0 ? 0 : Math.round((totalPresent / totalScrims) * 100);

    const scrimsWhenPresent = confirmed.length;
    const confirmedScrimIds = new Set(confirmed.map((a) => a.scrim_id));
    const winsWhenPresent = confirmed.filter((a) => {
      const result = resultByScrimId.get(a.scrim_id);
      return result?.is_win === true;
    }).length;
    const winRateWhenPresent =
      scrimsWhenPresent === 0
        ? 0
        : Math.round((winsWhenPresent / scrimsWhenPresent) * 100);

    // Streak: iterasi dari scrim terbaru ke lama
    let streak = 0;
    for (const r of results) {
      const isPresent = confirmedScrimIds.has(r.scrim_id);
      if (streak === 0) {
        streak = isPresent ? 1 : -1;
      } else if (streak > 0 && isPresent) {
        streak++;
      } else if (streak < 0 && !isPresent) {
        streak--;
      } else {
        break;
      }
    }

    return {
      ...player,
      attendanceRate,
      totalPresent,
      totalScrims,
      winRateWhenPresent,
      winsWhenPresent,
      scrimsWhenPresent,
      streak,
    };
  });

  return stats.sort((a, b) => b.attendanceRate - a.attendanceRate);
}
```

- [ ] **Step 1.2: Commit**

```bash
git add features/analytics/computations.ts
git commit -m "feat: add analytics pure computation functions"
```

---

## Task 2: Unit Tests untuk Computations

**Files:**
- Create: `features/analytics/__tests__/computations.test.ts`

- [ ] **Step 2.1: Buat test file**

```typescript
// features/analytics/__tests__/computations.test.ts
import { describe, it, expect } from "vitest";
import {
  computeOverviewStats,
  computeFormatBreakdown,
  computePlayerStats,
  type RawScrimResult,
  type RawAttendance,
  type PlayerInfo,
} from "@/features/analytics/computations";

// ── helpers ────────────────────────────────────────────────────────────────
const makeResult = (
  scrim_id: string,
  format: string,
  is_win: boolean | null,
): RawScrimResult => ({ scrim_id, format, is_win });

const makeAtt = (
  user_id: string,
  scrim_id: string,
  status: RawAttendance["status"],
): RawAttendance => ({ user_id, scrim_id, status });

const makePlayer = (user_id: string): PlayerInfo => ({
  user_id,
  display_name: `Player ${user_id}`,
  avatar_url: null,
  jersey_number: null,
  position: null,
});

// ── computeOverviewStats ───────────────────────────────────────────────────
describe("computeOverviewStats", () => {
  it("returns zeros for empty input", () => {
    expect(computeOverviewStats([])).toEqual({
      total: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    });
  });

  it("calculates win rate correctly for all wins", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", true),
    ];
    const stats = computeOverviewStats(results);
    expect(stats.wins).toBe(2);
    expect(stats.losses).toBe(0);
    expect(stats.winRate).toBe(100);
  });

  it("handles draws (is_win = null)", () => {
    const results = [
      makeResult("s1", "bo2", null),
      makeResult("s2", "bo2", true),
    ];
    const stats = computeOverviewStats(results);
    expect(stats.draws).toBe(1);
    expect(stats.total).toBe(2);
    expect(stats.winRate).toBe(50);
  });

  it("rounds win rate to nearest integer", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
      makeResult("s3", "bo3", false),
    ];
    const stats = computeOverviewStats(results);
    expect(stats.winRate).toBe(33);
  });
});

// ── computeFormatBreakdown ─────────────────────────────────────────────────
describe("computeFormatBreakdown", () => {
  it("returns empty array for empty input", () => {
    expect(computeFormatBreakdown([])).toEqual([]);
  });

  it("groups results by format", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
      makeResult("s3", "bo1", true),
    ];
    const breakdown = computeFormatBreakdown(results);
    const bo3 = breakdown.find((f) => f.format === "bo3");
    const bo1 = breakdown.find((f) => f.format === "bo1");
    expect(bo3?.total).toBe(2);
    expect(bo1?.total).toBe(1);
  });

  it("sorts by total descending", () => {
    const results = [
      makeResult("s1", "bo1", true),
      makeResult("s2", "bo3", true),
      makeResult("s3", "bo3", false),
      makeResult("s4", "bo3", true),
    ];
    const breakdown = computeFormatBreakdown(results);
    expect(breakdown[0]!.format).toBe("bo3");
    expect(breakdown[1]!.format).toBe("bo1");
  });
});

// ── computePlayerStats ─────────────────────────────────────────────────────
describe("computePlayerStats", () => {
  it("returns empty array when no players", () => {
    const results = [makeResult("s1", "bo3", true)];
    expect(computePlayerStats([], [], results)).toEqual([]);
  });

  it("calculates attendance rate correctly", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
    ];
    const attendances = [makeAtt("p1", "s1", "confirmed")];
    const players = [makePlayer("p1")];
    const stats = computePlayerStats(players, attendances, results);
    expect(stats[0]!.attendanceRate).toBe(50);
    expect(stats[0]!.totalPresent).toBe(1);
    expect(stats[0]!.totalScrims).toBe(2);
  });

  it("calculates win rate when present correctly", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
      makeResult("s3", "bo3", true),
    ];
    const attendances = [
      makeAtt("p1", "s1", "confirmed"),
      makeAtt("p1", "s2", "confirmed"),
      makeAtt("p1", "s3", "declined"),
    ];
    const players = [makePlayer("p1")];
    const stats = computePlayerStats(players, attendances, results);
    // hadir s1(win) s2(loss) → 1/2 = 50%
    expect(stats[0]!.scrimsWhenPresent).toBe(2);
    expect(stats[0]!.winsWhenPresent).toBe(1);
    expect(stats[0]!.winRateWhenPresent).toBe(50);
  });

  it("calculates positive streak (hadir beruntun)", () => {
    // results newest first: s1, s2, s3
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
      makeResult("s3", "bo3", true),
    ];
    const attendances = [
      makeAtt("p1", "s1", "confirmed"),
      makeAtt("p1", "s2", "confirmed"),
      makeAtt("p1", "s3", "declined"),
    ];
    const players = [makePlayer("p1")];
    const stats = computePlayerStats(players, attendances, results);
    // s1=hadir, s2=hadir → streak = 2
    expect(stats[0]!.streak).toBe(2);
  });

  it("calculates negative streak (absen beruntun)", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
    ];
    const attendances = [
      makeAtt("p1", "s1", "declined"),
      makeAtt("p1", "s2", "confirmed"),
    ];
    const players = [makePlayer("p1")];
    const stats = computePlayerStats(players, attendances, results);
    // s1=absen → streak = -1
    expect(stats[0]!.streak).toBe(-1);
  });

  it("sorts players by attendanceRate descending", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", true),
    ];
    const attendances = [
      makeAtt("p1", "s1", "confirmed"),
      makeAtt("p2", "s1", "confirmed"),
      makeAtt("p2", "s2", "confirmed"),
    ];
    const players = [makePlayer("p1"), makePlayer("p2")];
    const stats = computePlayerStats(players, attendances, results);
    // p2 hadir 2/2 = 100%, p1 hadir 1/2 = 50%
    expect(stats[0]!.user_id).toBe("p2");
    expect(stats[1]!.user_id).toBe("p1");
  });
});
```

- [ ] **Step 2.2: Jalankan test, pastikan PASS**

```bash
npx vitest run features/analytics/__tests__/computations.test.ts --reporter=verbose
```

Expected: semua test PASS.

- [ ] **Step 2.3: Commit**

```bash
git add features/analytics/__tests__/computations.test.ts
git commit -m "test: add analytics computation unit tests"
```

---

## Task 3: Analytics Queries (Supabase)

**Files:**
- Create: `features/analytics/queries.ts`

- [ ] **Step 3.1: Buat `features/analytics/queries.ts`**

```typescript
// features/analytics/queries.ts
import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  computeOverviewStats,
  computeFormatBreakdown,
  computePlayerStats,
  type RawScrimResult,
} from "./computations";

export type { OverviewStats, FormatStat, PlayerStat } from "./computations";

export interface RecentScrim {
  id: string;
  opponent_name: string;
  scheduled_at: string;
  format: string;
  division_name: string | null;
  is_win: boolean | null;
  our_score: number | null;
  opponent_score: number | null;
}

function extractIsWin(
  scrimResults: unknown,
): boolean | null {
  if (!scrimResults) return null;
  const arr = Array.isArray(scrimResults) ? scrimResults : [scrimResults];
  const first = arr[0] as { is_win?: boolean | null } | undefined;
  return first?.is_win ?? null;
}

export async function getOverviewStats(orgId: string): Promise<{
  stats: ReturnType<typeof computeOverviewStats>;
  formatBreakdown: ReturnType<typeof computeFormatBreakdown>;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scrims")
    .select("id, format, scrim_results(is_win)")
    .eq("organization_id", orgId)
    .eq("status", "completed");

  const results: RawScrimResult[] = (data ?? []).map((s) => ({
    scrim_id: s.id,
    format: s.format,
    is_win: extractIsWin(s.scrim_results),
  }));

  return {
    stats: computeOverviewStats(results),
    formatBreakdown: computeFormatBreakdown(results),
  };
}

export async function getRecentScrims(orgId: string): Promise<RecentScrim[]> {
  const supabase = await createClient();
  const { data: scrims } = await supabase
    .from("scrims")
    .select(
      "id, opponent_name, scheduled_at, format, division_id, scrim_results(is_win, our_score, opponent_score)",
    )
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(10);

  if (!scrims || scrims.length === 0) return [];

  const divisionIds = [
    ...new Set(scrims.map((s) => s.division_id).filter(Boolean)),
  ] as string[];

  let divisionMap = new Map<string, string>();
  if (divisionIds.length > 0) {
    const { data: divisions } = await supabase
      .from("divisions")
      .select("id, name")
      .in("id", divisionIds);
    divisionMap = new Map((divisions ?? []).map((d) => [d.id, d.name]));
  }

  return scrims.map((s) => {
    const arr = Array.isArray(s.scrim_results)
      ? s.scrim_results
      : [s.scrim_results];
    const result = arr[0] as
      | { is_win?: boolean | null; our_score?: number | null; opponent_score?: number | null }
      | undefined;
    return {
      id: s.id,
      opponent_name: s.opponent_name,
      scheduled_at: s.scheduled_at,
      format: s.format,
      division_name: s.division_id ? (divisionMap.get(s.division_id) ?? null) : null,
      is_win: result?.is_win ?? null,
      our_score: result?.our_score ?? null,
      opponent_score: result?.opponent_score ?? null,
    };
  });
}

export async function getPlayerStats(
  orgId: string,
): Promise<ReturnType<typeof computePlayerStats>> {
  const supabase = await createClient();

  // Newest first untuk streak computation
  const { data: scrims } = await supabase
    .from("scrims")
    .select("id, format, scrim_results(is_win)")
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false });

  const results: RawScrimResult[] = (scrims ?? []).map((s) => ({
    scrim_id: s.id,
    format: s.format,
    is_win: extractIsWin(s.scrim_results),
  }));

  if (results.length === 0) return [];

  const scrimIds = results.map((r) => r.scrim_id);

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, jersey_number, position")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .in("role", ["captain", "member"]);

  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);

  const [profilesRes, attendancesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds),
    supabase
      .from("scrim_attendances")
      .select("user_id, scrim_id, status")
      .in("scrim_id", scrimIds)
      .in("user_id", userIds),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p]),
  );

  const players = members.map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      user_id: m.user_id,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      jersey_number: m.jersey_number,
      position: m.position,
    };
  });

  const attendances = (attendancesRes.data ?? []).map((a) => ({
    user_id: a.user_id,
    scrim_id: a.scrim_id,
    status: a.status as "confirmed" | "declined" | "tentative" | "pending",
  }));

  return computePlayerStats(players, attendances, results);
}
```

- [ ] **Step 3.2: Commit**

```bash
git add features/analytics/queries.ts
git commit -m "feat: add analytics Supabase queries"
```

---

## Task 4: Placeholder Tab Components

**Files:**
- Create: `features/analytics/components/tabs/DraftAnalyticsTab.tsx`
- Create: `features/analytics/components/tabs/AIInsightsTab.tsx`

- [ ] **Step 4.1: Buat `DraftAnalyticsTab.tsx`**

```tsx
// features/analytics/components/tabs/DraftAnalyticsTab.tsx
import { FlaskConical } from "lucide-react";

export function DraftAnalyticsTab() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C] p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252525]">
        <FlaskConical className="h-6 w-6 text-[#6B6A68]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#E5E2E1]">Draft Analytics</p>
        <p className="mt-1 text-xs text-[#6B6A68]">
          Fitur analitik draft sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Buat `AIInsightsTab.tsx`**

```tsx
// features/analytics/components/tabs/AIInsightsTab.tsx
import { Sparkles } from "lucide-react";

export function AIInsightsTab() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C] p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252525]">
        <Sparkles className="h-6 w-6 text-[#6B6A68]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#E5E2E1]">AI Insights</p>
        <p className="mt-1 text-xs text-[#6B6A68]">
          Analisis AI sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.3: Commit**

```bash
git add features/analytics/components/tabs/DraftAnalyticsTab.tsx features/analytics/components/tabs/AIInsightsTab.tsx
git commit -m "feat: add placeholder tab components for Draft Analytics and AI Insights"
```

---

## Task 5: Overview Tab

**Files:**
- Create: `features/analytics/components/tabs/OverviewTab.tsx`

- [ ] **Step 5.1: Buat `OverviewTab.tsx`**

```tsx
// features/analytics/components/tabs/OverviewTab.tsx
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { OverviewStats, FormatStat, RecentScrim } from "@/features/analytics/queries";

interface OverviewTabProps {
  stats: OverviewStats;
  formatBreakdown: FormatStat[];
  recentScrims: RecentScrim[];
}

const FORMAT_LABELS: Record<string, string> = {
  bo1: "BO1",
  bo2: "BO2",
  bo3: "BO3",
  bo5: "BO5",
  bo7: "BO7",
  "4match": "4 Match",
};

export function OverviewTab({ stats, formatBreakdown, recentScrims }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Scrim" value={String(stats.total)} sub="completed" />
        <StatCard
          label="Menang"
          value={String(stats.wins)}
          sub="kemenangan"
          valueClass="text-emerald-400"
        />
        <StatCard
          label="Kalah"
          value={String(stats.losses)}
          sub="kekalahan"
          valueClass="text-rose-400"
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          sub="keseluruhan"
          valueClass={stats.winRate >= 50 ? "text-yellow-400" : "text-rose-400"}
        />
      </div>

      {/* Win Rate Bar + Format Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Win Rate Bar */}
        <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
            Win Rate Keseluruhan
          </p>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-3xl font-bold ${stats.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                {stats.winRate}%
              </span>
              <span className="text-xs text-[#6B6A68]">
                {stats.wins}W · {stats.losses}L · {stats.draws}D
              </span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#252525]">
              <div
                style={{ width: `${(stats.wins / (stats.total || 1)) * 100}%` }}
                className="h-full bg-emerald-500/70"
              />
              <div
                style={{ width: `${(stats.draws / (stats.total || 1)) * 100}%` }}
                className="h-full bg-zinc-500/40"
              />
              <div
                style={{ width: `${(stats.losses / (stats.total || 1)) * 100}%` }}
                className="h-full bg-rose-500/70"
              />
            </div>
            <div className="flex gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-[#9B9A97]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                Menang
              </span>
              <span className="flex items-center gap-1.5 text-[#9B9A97]">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 inline-block" />
                Seri
              </span>
              <span className="flex items-center gap-1.5 text-[#9B9A97]">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                Kalah
              </span>
            </div>
          </div>
        </div>

        {/* Format Breakdown */}
        <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
            Per Format
          </p>
          {formatBreakdown.length === 0 ? (
            <p className="text-xs text-[#6B6A68]">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {formatBreakdown.map((f) => (
                <div key={f.format} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#E5E2E1]">
                      {FORMAT_LABELS[f.format] ?? f.format.toUpperCase()}
                    </span>
                    <span className="text-[#6B6A68]">
                      {f.wins}W / {f.losses}L · {f.winRate}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#252525]">
                    <div
                      style={{ width: `${f.winRate}%` }}
                      className={`h-full rounded-full ${f.winRate >= 50 ? "bg-emerald-500/60" : "bg-rose-500/60"}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Scrims */}
      <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2D2D2D]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
            10 Scrim Terakhir
          </p>
        </div>
        {recentScrims.length === 0 ? (
          <p className="px-5 py-8 text-xs text-[#6B6A68] text-center">
            Belum ada scrim selesai.
          </p>
        ) : (
          <div className="divide-y divide-[#2D2D2D]">
            {recentScrims.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#E5E2E1]">
                    vs {s.opponent_name}
                  </p>
                  <p className="text-xs text-[#6B6A68]">
                    {format(new Date(s.scheduled_at), "d MMM yyyy", { locale: id })}
                    {s.division_name ? ` · ${s.division_name}` : ""}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#9B9A97]">
                  {FORMAT_LABELS[s.format.toLowerCase()] ?? s.format.toUpperCase()}
                </span>
                {s.our_score !== null && s.opponent_score !== null ? (
                  <span className="text-xs font-medium text-[#9B9A97]">
                    {s.our_score}–{s.opponent_score}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-bold border ${
                    s.is_win === true
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : s.is_win === false
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  }`}
                >
                  {s.is_win === true ? "W" : s.is_win === false ? "L" : "D"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueClass = "text-[#E5E2E1]",
}: {
  label: string;
  value: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9B9A97]">
        {label}
      </p>
      <p className={`text-3xl font-bold tracking-tight ${valueClass}`}>{value}</p>
      <p className="text-[11px] text-[#6B6A68]">{sub}</p>
    </div>
  );
}
```

- [ ] **Step 5.2: Commit**

```bash
git add features/analytics/components/tabs/OverviewTab.tsx
git commit -m "feat: add Overview analytics tab component"
```

---

## Task 6: Player Stats Tab

**Files:**
- Create: `features/analytics/components/tabs/PlayerStatsTab.tsx`

- [ ] **Step 6.1: Buat `PlayerStatsTab.tsx`**

```tsx
// features/analytics/components/tabs/PlayerStatsTab.tsx
import { Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PlayerStat } from "@/features/analytics/queries";

interface PlayerStatsTabProps {
  playerStats: PlayerStat[];
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function PlayerStatsTab({ playerStats }: PlayerStatsTabProps) {
  if (playerStats.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C] p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252525]">
          <Users className="h-6 w-6 text-[#6B6A68]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#E5E2E1]">Belum ada data player</p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Data muncul setelah ada scrim selesai dengan anggota aktif.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {playerStats.map((player) => (
        <PlayerCard key={player.user_id} player={player} />
      ))}
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerStat }) {
  const streakPositive = player.streak > 0;
  const streakText =
    player.streak === 0
      ? "—"
      : streakPositive
        ? `${player.streak} hadir beruntun`
        : `${Math.abs(player.streak)} absen terakhir`;

  return (
    <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-4 transition-colors hover:border-[#3D3D3D]">
      {/* Header: avatar + nama */}
      <div className="flex items-center gap-3">
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt={player.display_name ?? "Player"}
            className="h-10 w-10 rounded-full object-cover border border-[#2D2D2D]"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#252525] text-xs font-bold text-[#9B9A97] border border-[#2D2D2D]">
            {getInitials(player.display_name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#E5E2E1]">
            {player.display_name ?? "Unknown"}
          </p>
          <p className="text-[11px] text-[#6B6A68]">
            {[player.position, player.jersey_number ? `#${player.jersey_number}` : null]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#9B9A97]">Kehadiran</span>
          <span className="font-semibold text-[#E5E2E1]">{player.attendanceRate}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#252525]">
          <div
            style={{ width: `${player.attendanceRate}%` }}
            className={cn(
              "h-full rounded-full transition-all",
              player.attendanceRate >= 75
                ? "bg-emerald-500/70"
                : player.attendanceRate >= 50
                  ? "bg-yellow-400/70"
                  : "bg-rose-500/70",
            )}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#252525] p-3">
        <div className="text-center">
          <p className="text-[10px] text-[#6B6A68]">Hadir</p>
          <p className="text-sm font-bold text-[#E5E2E1]">{player.totalPresent}</p>
        </div>
        <div className="text-center border-x border-[#2D2D2D]">
          <p className="text-[10px] text-[#6B6A68]">WR Hadir</p>
          <p className={cn(
            "text-sm font-bold",
            player.winRateWhenPresent >= 50 ? "text-emerald-400" : "text-rose-400",
          )}>
            {player.scrimsWhenPresent === 0 ? "—" : `${player.winRateWhenPresent}%`}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#6B6A68]">Streak</p>
          <p className={cn(
            "text-sm font-bold",
            player.streak > 0
              ? "text-emerald-400"
              : player.streak < 0
                ? "text-rose-400"
                : "text-[#6B6A68]",
          )}>
            {player.streak === 0 ? "—" : Math.abs(player.streak)}
          </p>
        </div>
      </div>

      {/* Streak label */}
      <p className={cn(
        "text-[11px]",
        streakPositive ? "text-emerald-400/80" : player.streak < 0 ? "text-rose-400/80" : "text-[#6B6A68]",
      )}>
        {streakText}
      </p>
    </div>
  );
}
```

- [ ] **Step 6.2: Commit**

```bash
git add features/analytics/components/tabs/PlayerStatsTab.tsx
git commit -m "feat: add Player Stats analytics tab component"
```

---

## Task 7: AnalyticsDashboard Client Component

**Files:**
- Create: `features/analytics/components/AnalyticsDashboard.tsx`

- [ ] **Step 7.1: Buat `AnalyticsDashboard.tsx`**

```tsx
// features/analytics/components/AnalyticsDashboard.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { OverviewTab } from "./tabs/OverviewTab";
import { DraftAnalyticsTab } from "./tabs/DraftAnalyticsTab";
import { PlayerStatsTab } from "./tabs/PlayerStatsTab";
import { AIInsightsTab } from "./tabs/AIInsightsTab";
import type { OverviewStats, FormatStat, RecentScrim, PlayerStat } from "@/features/analytics/queries";

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
  playerStats: PlayerStat[];
}

export function AnalyticsDashboard({
  overviewStats,
  formatBreakdown,
  recentScrims,
  playerStats,
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
              "relative pb-3 px-1 mr-5 text-sm font-medium transition-colors cursor-pointer",
              activeTab === tab.key
                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-yellow-400 after:rounded-full"
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
      {activeTab === "draft" && <DraftAnalyticsTab />}
      {activeTab === "players" && <PlayerStatsTab playerStats={playerStats} />}
      {activeTab === "ai" && <AIInsightsTab />}
    </div>
  );
}
```

- [ ] **Step 7.2: Commit**

```bash
git add features/analytics/components/AnalyticsDashboard.tsx
git commit -m "feat: add AnalyticsDashboard client component with tab navigation"
```

---

## Task 8: Analytics Page Route

**Files:**
- Create: `app/[team-slug]/(workspace)/analytics/page.tsx`

- [ ] **Step 8.1: Buat `analytics/page.tsx`**

```tsx
// app/[team-slug]/(workspace)/analytics/page.tsx
import { BarChart3 } from "lucide-react";
import { notFound } from "next/navigation";

import { AnalyticsDashboard } from "@/features/analytics/components/AnalyticsDashboard";
import {
  getOverviewStats,
  getRecentScrims,
  getPlayerStats,
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

  const [{ stats, formatBreakdown }, recentScrims, playerStats] =
    await Promise.all([
      getOverviewStats(organization.id),
      getRecentScrims(organization.id),
      getPlayerStats(organization.id),
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
      />
    </div>
  );
}
```

- [ ] **Step 8.2: Commit**

```bash
git add app/[team-slug]/\(workspace\)/analytics/page.tsx
git commit -m "feat: add analytics page route"
```

---

## Task 9: Modifikasi FinishScrimForm — Redirect + Toast

**Files:**
- Modify: `features/scrim/components/FinishScrimForm.tsx:144-162`

- [ ] **Step 9.1: Buka `features/scrim/components/FinishScrimForm.tsx` dan cari blok `handleSubmit`**

Baris yang diubah ada di dalam `startTransition` callback, bagian `if (res.ok)`:

```tsx
// BEFORE (baris ~155-160):
if (res.ok) {
  router.push(`/${orgSlug}/scrim/${scrimId}`);
} else {
  setError(res.message ?? "Gagal menyimpan hasil");
}

// AFTER:
if (res.ok) {
  toast.success("Hasil scrim disimpan!");
  router.push(`/${orgSlug}/analytics`);
} else {
  setError(res.message ?? "Gagal menyimpan hasil");
}
```

Tambahkan juga import `toast` di bagian atas file (setelah import yang sudah ada):

```tsx
import { toast } from "sonner";
```

- [ ] **Step 9.2: Jalankan TypeScript check untuk pastikan tidak ada error**

```bash
npx tsc --noEmit
```

Expected: tidak ada error.

- [ ] **Step 9.3: Commit**

```bash
git add features/scrim/components/FinishScrimForm.tsx
git commit -m "feat: redirect to analytics dashboard after finishing scrim"
```

---

## Task 10: Push ke Remote

- [ ] **Step 10.1: Push semua commit**

```bash
git push origin main
```

---

## Self-Review Checklist

- [x] Spec coverage: redirect flow ✓, Overview tab ✓, Player Stats tab ✓, Draft placeholder ✓, AI placeholder ✓
- [x] No placeholders: semua langkah punya code lengkap
- [x] Type consistency: `OverviewStats`, `FormatStat`, `PlayerStat`, `RecentScrim` konsisten dari computations → queries → components → page
- [x] `RawScrimResult` dipakai di computations.ts dan queries.ts secara konsisten
- [x] `extractIsWin` helper dipakai di kedua tempat di queries.ts
- [x] `getInitials` di PlayerStatsTab handle null display_name
- [x] Empty states: OverviewTab, PlayerStatsTab, dan placeholder tabs semua punya empty state
