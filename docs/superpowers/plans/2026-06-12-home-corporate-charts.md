# Home Corporate Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add corporate-style analytics to the owner dashboard Home: sparklines inside the Executive Summary metric cards plus a 2Ã—2 theme-aware chart grid (win rate, cash flow, attendance, sponsor donut) below them.

**Architecture:** A new server-only query `getHomeChartData(orgId)` aggregates 6 months of scrims/attendance/finances/sponsors into pure, unit-tested bucketing functions. Client chart components (recharts 3.8.1, already installed) render the data using CSS variables (`var(--ui-border)` etc.) so dark/light theming is automatic. The page wires the query into the existing `Promise.all` and renders charts inside the Executive Summary block so the org switcher updates them.

**Tech Stack:** Next.js 15 App Router (server components), recharts 3.8.1, Supabase admin client, vitest.

**Spec:** `docs/superpowers/specs/2026-06-12-home-corporate-charts-design.md`

**Spec amendment (donut center label):** total sponsor value goes in the ChartCard subtitle ("Total Rp X") instead of an SVG center label â€” the legend shifts the pie center, making an absolute-positioned center label fragile.

**Coverage note:** `features/dashboard/**` is NOT in the vitest coverage `include` scope (see `vitest.config.ts`), so this feature cannot drop coverage below thresholds. Tests are still written for correctness.

**Commits:** Two gated commits â€” Task 2 (data layer + tests) and Task 6 (UI + wiring). Per CLAUDE.md, run `npm run lint`, `npm run typecheck`, `npm run test:unit:coverage` before each commit.

---

### Task 1: Pure aggregation logic + tests (TDD)

**Files:**
- Create: `features/dashboard/queries/homeCharts.ts` (pure functions only in this task)
- Create: `features/dashboard/__tests__/homeCharts.test.ts`

- [x] **Step 1: Write the failing tests**

Create `features/dashboard/__tests__/homeCharts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  buildMonthKeys,
  monthKeyOf,
  monthLabelOf,
  bucketScrims,
  bucketAttendance,
  bucketFinances,
} from "@/features/dashboard/queries/homeCharts";

describe("buildMonthKeys", () => {
  it("returns 6 keys oldest to newest including current month", () => {
    expect(buildMonthKeys(new Date(2026, 5, 12))).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
    ]);
  });

  it("handles year boundary", () => {
    expect(buildMonthKeys(new Date(2026, 1, 15))).toEqual([
      "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02",
    ]);
  });
});

describe("monthKeyOf / monthLabelOf", () => {
  it("extracts month key from timestamp", () => {
    expect(monthKeyOf("2026-03-15T10:00:00")).toBe("2026-03");
  });

  it("maps key to Indonesian short label", () => {
    expect(monthLabelOf("2026-05")).toBe("Mei");
    expect(monthLabelOf("2026-08")).toBe("Agu");
  });
});

describe("bucketScrims", () => {
  const keys = ["2026-04", "2026-05", "2026-06"];

  it("computes win rate per month from completed scrims only", () => {
    const scrims = [
      { id: "a", scheduled_at: "2026-05-10T12:00:00", status: "completed", scrim_results: { is_win: true } },
      { id: "b", scheduled_at: "2026-05-20T12:00:00", status: "completed", scrim_results: [{ is_win: false }] },
      { id: "c", scheduled_at: "2026-05-25T12:00:00", status: "scheduled", scrim_results: null },
    ];
    const out = bucketScrims(scrims, keys);
    expect(out[1]).toEqual({ monthKey: "2026-05", winRate: 50, scrimCount: 2 });
    expect(out[0]).toEqual({ monthKey: "2026-04", winRate: 0, scrimCount: 0 });
  });

  it("ignores scrims outside the window", () => {
    const scrims = [
      { id: "old", scheduled_at: "2026-01-10T12:00:00", status: "completed", scrim_results: { is_win: true } },
    ];
    const out = bucketScrims(scrims, keys);
    expect(out.every((m) => m.scrimCount === 0)).toBe(true);
  });
});

describe("bucketAttendance", () => {
  const keys = ["2026-05", "2026-06"];

  it("computes confirmed percentage per month via scrim month map", () => {
    const scrimMonth = new Map([["s1", "2026-05"], ["s2", "2026-06"]]);
    const attendances = [
      { scrim_id: "s1", status: "confirmed" },
      { scrim_id: "s1", status: "declined" },
      { scrim_id: "s2", status: "confirmed" },
      { scrim_id: "unknown", status: "confirmed" },
    ];
    expect(bucketAttendance(attendances, scrimMonth, keys)).toEqual([50, 100]);
  });

  it("returns 0 for months with no attendance", () => {
    expect(bucketAttendance([], new Map(), keys)).toEqual([0, 0]);
  });
});

describe("bucketFinances", () => {
  const keys = ["2026-05", "2026-06"];

  it("buckets income/expense per month with cumulative balance", () => {
    const finances = [
      { type: "income" as const, amount: 1000, date: "2026-05-10" },
      { type: "expense" as const, amount: 300, date: "2026-05-15" },
      { type: "expense" as const, amount: 200, date: "2026-06-01" },
    ];
    expect(bucketFinances(finances, keys)).toEqual([
      { income: 1000, expense: 300, cumulativeBalance: 700 },
      { income: 0, expense: 200, cumulativeBalance: 500 },
    ]);
  });

  it("includes pre-window transactions as starting offset", () => {
    const finances = [
      { type: "income" as const, amount: 5000, date: "2026-01-10" },
      { type: "expense" as const, amount: 1000, date: "2026-03-05" },
      { type: "income" as const, amount: 100, date: "2026-06-02" },
    ];
    expect(bucketFinances(finances, keys)).toEqual([
      { income: 0, expense: 0, cumulativeBalance: 4000 },
      { income: 100, expense: 0, cumulativeBalance: 4100 },
    ]);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `rtk vitest run features/dashboard/__tests__/homeCharts.test.ts`
Expected: FAIL â€” module `@/features/dashboard/queries/homeCharts` not found.

- [x] **Step 3: Implement the pure functions**

Create `features/dashboard/queries/homeCharts.ts`:

```ts
import "server-only";

export interface MonthPoint {
  monthKey: string;
  monthLabel: string;
  winRate: number;
  scrimCount: number;
  attendanceRate: number;
  income: number;
  expense: number;
  cumulativeBalance: number;
}

export interface SponsorSlice {
  name: string;
  value: number;
}

export interface HomeChartData {
  months: MonthPoint[];
  sponsors: SponsorSlice[];
}

export interface ScrimRow {
  id: string;
  scheduled_at: string;
  status: string;
  scrim_results: { is_win: boolean | null } | { is_win: boolean | null }[] | null;
}

export interface AttendanceRow {
  scrim_id: string;
  status: string;
}

export interface FinanceRow {
  type: "income" | "expense";
  amount: number;
  date: string;
}

const MONTH_LABELS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export function buildMonthKeys(now: Date): string[] {
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function monthKeyOf(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabelOf(key: string): string {
  const m = Number(key.slice(5)) - 1;
  return MONTH_LABELS_ID[m] ?? key;
}

export function bucketScrims(
  scrims: ScrimRow[],
  monthKeys: string[],
): { monthKey: string; winRate: number; scrimCount: number }[] {
  const map = new Map(monthKeys.map((k) => [k, { wins: 0, total: 0 }]));
  for (const s of scrims) {
    if (s.status !== "completed") continue;
    const bucket = map.get(monthKeyOf(s.scheduled_at));
    if (!bucket) continue;
    const result = Array.isArray(s.scrim_results) ? s.scrim_results[0] : s.scrim_results;
    bucket.total++;
    if (result?.is_win === true) bucket.wins++;
  }
  return monthKeys.map((k) => {
    const b = map.get(k)!;
    return {
      monthKey: k,
      winRate: b.total > 0 ? Math.round((b.wins / b.total) * 100) : 0,
      scrimCount: b.total,
    };
  });
}

export function bucketAttendance(
  attendances: AttendanceRow[],
  scrimMonth: Map<string, string>,
  monthKeys: string[],
): number[] {
  const map = new Map(monthKeys.map((k) => [k, { confirmed: 0, total: 0 }]));
  for (const a of attendances) {
    const key = scrimMonth.get(a.scrim_id);
    if (!key) continue;
    const b = map.get(key);
    if (!b) continue;
    b.total++;
    if (a.status === "confirmed") b.confirmed++;
  }
  return monthKeys.map((k) => {
    const b = map.get(k)!;
    return b.total > 0 ? Math.round((b.confirmed / b.total) * 100) : 0;
  });
}

export function bucketFinances(
  finances: FinanceRow[],
  monthKeys: string[],
): { income: number; expense: number; cumulativeBalance: number }[] {
  const firstKey = monthKeys[0];
  let offset = 0;
  const map = new Map(monthKeys.map((k) => [k, { income: 0, expense: 0 }]));
  for (const f of finances) {
    const key = monthKeyOf(f.date);
    const b = map.get(key);
    if (b) {
      if (f.type === "income") b.income += f.amount;
      else b.expense += f.amount;
    } else if (key < firstKey) {
      offset += f.type === "income" ? f.amount : -f.amount;
    }
  }
  let running = offset;
  return monthKeys.map((k) => {
    const b = map.get(k)!;
    running += b.income - b.expense;
    return { income: b.income, expense: b.expense, cumulativeBalance: running };
  });
}
```

(Note: `"YYYY-MM"` string comparison `key < firstKey` is correct lexicographic date ordering.)

- [x] **Step 4: Run tests to verify they pass**

Run: `rtk vitest run features/dashboard/__tests__/homeCharts.test.ts`
Expected: all tests PASS.

---

### Task 2: `getHomeChartData` query wrapper + test + first commit

**Files:**
- Modify: `features/dashboard/queries/homeCharts.ts` (append)
- Modify: `features/dashboard/__tests__/homeCharts.test.ts` (append)

- [x] **Step 1: Write the failing test**

Append to `features/dashboard/__tests__/homeCharts.test.ts` (add `vi` and the mock at the top of the file):

```ts
// add to existing imports at top of file:
import { vi, beforeEach } from "vitest";
import { getHomeChartData } from "@/features/dashboard/queries/homeCharts";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin");
```

Then append the describe block:

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
function chain(result: { data: unknown; error: unknown }) {
  const c: any = {
    select: () => c,
    eq: () => c,
    gte: () => c,
    in: () => c,
    limit: () => Promise.resolve(result),
  };
  return c;
}

describe("getHomeChartData", () => {
  beforeEach(() => {
    const tables: Record<string, { data: unknown; error: unknown }> = {
      scrims: { data: [], error: null },
      finances: { data: [], error: null },
      sponsors: {
        data: [
          { name: "Acme", deal_value: 1_000_000 },
          { name: "ZeroCo", deal_value: 0 },
          { name: "NullCo", deal_value: null },
        ],
        error: null,
      },
      scrim_attendances: { data: [], error: null },
    };
    vi.mocked(createAdminClient).mockReturnValue({
      from: (table: string) => chain(tables[table] ?? { data: [], error: null }),
    } as any);
  });

  it("returns exactly 6 months and filters zero-value sponsors", async () => {
    const out = await getHomeChartData("org-1");
    expect(out.months).toHaveLength(6);
    expect(out.months.every((m) => m.scrimCount === 0 && m.winRate === 0)).toBe(true);
    expect(out.sponsors).toEqual([{ name: "Acme", value: 1_000_000 }]);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `rtk vitest run features/dashboard/__tests__/homeCharts.test.ts`
Expected: FAIL â€” `getHomeChartData` is not exported.

- [x] **Step 3: Implement the wrapper**

Append to `features/dashboard/queries/homeCharts.ts` (and add the import at the top, below `import "server-only";`):

```ts
import { createAdminClient } from "@/lib/supabase/admin";
```

```ts
export async function getHomeChartData(orgId: string): Promise<HomeChartData> {
  const admin = createAdminClient();
  const monthKeys = buildMonthKeys(new Date());
  const windowStart = `${monthKeys[0]}-01`;

  const [scrimsRes, financesRes, sponsorsRes] = await Promise.all([
    admin
      .from("scrims")
      .select("id, scheduled_at, status, scrim_results(is_win)")
      .eq("organization_id", orgId)
      .gte("scheduled_at", windowStart)
      .limit(200),
    admin
      .from("finances")
      .select("type, amount, date")
      .eq("organization_id", orgId)
      .limit(500),
    admin
      .from("sponsors")
      .select("name, deal_value")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .limit(50),
  ]);

  if (scrimsRes.error) console.error("[getHomeChartData] scrims:", scrimsRes.error);
  if (financesRes.error) console.error("[getHomeChartData] finances:", financesRes.error);
  if (sponsorsRes.error) console.error("[getHomeChartData] sponsors:", sponsorsRes.error);

  const scrims = (scrimsRes.data ?? []) as ScrimRow[];
  const scrimMonth = new Map(scrims.map((s) => [s.id, monthKeyOf(s.scheduled_at)]));

  let attendances: AttendanceRow[] = [];
  if (scrims.length > 0) {
    const { data, error } = await admin
      .from("scrim_attendances")
      .select("scrim_id, status")
      .in("scrim_id", scrims.map((s) => s.id))
      .limit(1000);
    if (error) console.error("[getHomeChartData] attendances:", error);
    attendances = data ?? [];
  }

  const scrimSeries = bucketScrims(scrims, monthKeys);
  const attendanceSeries = bucketAttendance(attendances, scrimMonth, monthKeys);
  const financeSeries = bucketFinances((financesRes.data ?? []) as FinanceRow[], monthKeys);

  const months: MonthPoint[] = monthKeys.map((k, i) => ({
    monthKey: k,
    monthLabel: monthLabelOf(k),
    winRate: scrimSeries[i].winRate,
    scrimCount: scrimSeries[i].scrimCount,
    attendanceRate: attendanceSeries[i],
    income: financeSeries[i].income,
    expense: financeSeries[i].expense,
    cumulativeBalance: financeSeries[i].cumulativeBalance,
  }));

  const sponsors: SponsorSlice[] = (sponsorsRes.data ?? [])
    .filter((s) => (s.deal_value ?? 0) > 0)
    .map((s) => ({ name: s.name, value: s.deal_value ?? 0 }));

  return { months, sponsors };
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `rtk vitest run features/dashboard/__tests__/homeCharts.test.ts`
Expected: all tests PASS.

- [x] **Step 5: Pre-commit gate + commit**

Run all three (per CLAUDE.md, all must pass):

```bash
rtk npm run lint
rtk npm run typecheck
rtk npm run test:unit:coverage
```

Then:

```bash
rtk git add features/dashboard/queries/homeCharts.ts features/dashboard/__tests__/homeCharts.test.ts
rtk git commit -m "feat: add home chart data query with monthly aggregation"
rtk git push
```

---

### Task 3: Sparkline component + ExecutiveSummary integration

**Files:**
- Create: `features/dashboard/components/charts/Sparkline.tsx`
- Modify: `features/dashboard/components/ExecutiveSummary.tsx`

- [x] **Step 1: Create Sparkline**

Create `features/dashboard/components/charts/Sparkline.tsx`:

```tsx
"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color: string;
  id: string;
}

const Sparkline = ({ data, color, id }: SparklineProps) => {
  if (data.length < 2 || data.every((v) => v === data[0])) return null;
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-7 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export { Sparkline };
```

- [x] **Step 2: Extend MetricCard + ExecutiveSummary**

Modify `features/dashboard/components/ExecutiveSummary.tsx`:

Add import:

```tsx
import { Sparkline } from "@/features/dashboard/components/charts/Sparkline";
import type { HomeChartData } from "@/features/dashboard/queries/homeCharts";
```

Note: `homeCharts.ts` imports `"server-only"`, but `import type` is erased at compile time, so importing the type here is safe regardless of where the component renders. Use `import type` exactly as shown â€” a value import would break client bundling.

Extend `MetricCardProps` and `MetricCard`:

```tsx
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  trend?: number[];
  trendColor?: string;
  sparkId?: string;
}

function MetricCard({ icon, label, value, sub, accent, trend, trendColor, sparkId }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-ui-border bg-ui-surface p-3 sm:p-4 flex flex-col justify-between items-center text-center min-h-[100px]">
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-ui-text-muted font-semibold uppercase tracking-wider whitespace-nowrap w-full">
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
        {label}
      </div>
      <div className="flex-1 flex items-center justify-center my-1 w-full">
        <p className={`text-lg sm:text-2xl font-bold tracking-tight whitespace-nowrap ${accent ?? "text-ui-text"} text-center`}>
          {value}
        </p>
      </div>
      {trend && sparkId && (
        <Sparkline data={trend} color={trendColor ?? "#22c55e"} id={sparkId} />
      )}
      {sub && <p className="text-[10px] text-ui-text-muted whitespace-nowrap text-center w-full">{sub}</p>}
    </div>
  );
}
```

Extend `ExecutiveSummaryProps` and wire trends:

```tsx
interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
  orgName: string;
  chartData?: HomeChartData;
}

const ExecutiveSummary = ({ summary, orgName, chartData }: ExecutiveSummaryProps) => {
  // ... existing color logic unchanged ...

  const winTrend = chartData?.months.map((m) => m.winRate);
  const attendanceTrend = chartData?.months.map((m) => m.attendanceRate);
  const balanceTrend = chartData?.months.map((m) => m.cumulativeBalance);
  const balanceTrendColor =
    (balanceTrend?.[balanceTrend.length - 1] ?? 0) >= 0 ? "#22c55e" : "#ef4444";
```

Pass to the three cards (others unchanged):

```tsx
        <MetricCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Win Rate"
          value={`${summary.winRate}%`}
          sub={`${summary.totalScrims} scrim selesai`}
          accent={winRateColor}
          trend={winTrend}
          trendColor="#22c55e"
          sparkId="winrate"
        />
        <MetricCard
          icon={<Target className="h-3.5 w-3.5" />}
          label="Attendance"
          value={`${summary.attendanceRate}%`}
          sub="Rata-rata kehadiran"
          accent={attendanceColor}
          trend={attendanceTrend}
          trendColor="#3b82f6"
          sparkId="attendance"
        />
        {/* ...Member Aktif, Sponsor Aktif, Nilai Sponsor unchanged... */}
        <MetricCard
          icon={<Wallet className="h-3.5 w-3.5" />}
          label="Saldo Kas"
          value={formatRupiah(summary.netBalance)}
          sub="Kumulatif semua waktu"
          accent={balanceColor}
          trend={balanceTrend}
          trendColor={balanceTrendColor}
          sparkId="balance"
        />
```

- [x] **Step 3: Verify diagnostics clean**

Run: `rtk npm run typecheck`
Expected: exit 0.

---

### Task 4: ChartCard + four chart components

**Files:**
- Create: `features/dashboard/components/charts/ChartCard.tsx`
- Create: `features/dashboard/components/charts/WinRateAreaChart.tsx`
- Create: `features/dashboard/components/charts/CashFlowChart.tsx`
- Create: `features/dashboard/components/charts/AttendanceLineChart.tsx`
- Create: `features/dashboard/components/charts/SponsorDonutChart.tsx`

Shared style constants (repeat in each chart file â€” they're small): tooltip
`contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}`,
`labelStyle={{ color: "var(--ui-text)" }}`, `itemStyle={{ color: "var(--ui-text-2)" }}`;
axis ticks `tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }}` with `axisLine={false} tickLine={false}`;
grid `<CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />`.

- [x] **Step 1: Create ChartCard**

Create `features/dashboard/components/charts/ChartCard.tsx`:

```tsx
interface ChartCardProps {
  title: string;
  subtitle?: string;
  isEmpty?: boolean;
  children: React.ReactNode;
}

const ChartCard = ({ title, subtitle, isEmpty, children }: ChartCardProps) => {
  return (
    <div className="rounded-xl border border-ui-border bg-ui-surface p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-ui-text">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ui-text-muted">{subtitle}</p>}
      </div>
      <div className="relative">
        {children}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-ui-text-muted">Belum ada data</span>
          </div>
        )}
      </div>
    </div>
  );
};
export { ChartCard };
```

- [x] **Step 2: Create WinRateAreaChart**

Create `features/dashboard/components/charts/WinRateAreaChart.tsx`:

```tsx
"use client";

import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthPoint } from "@/features/dashboard/queries/homeCharts";

const WinRateAreaChart = ({ months }: { months: MonthPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={months} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="homeWinRateFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--ui-text)" }}
          itemStyle={{ color: "var(--ui-text-2)" }}
          formatter={(value, _name, item) => [
            `${value ?? 0}% (${(item?.payload as MonthPoint | undefined)?.scrimCount ?? 0} scrim)`,
            "Win Rate",
          ]}
        />
        <Area
          type="monotone"
          dataKey="winRate"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#homeWinRateFill)"
          dot={{ r: 2.5, fill: "#22c55e", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
export { WinRateAreaChart };
```

- [x] **Step 3: Create CashFlowChart**

Create `features/dashboard/components/charts/CashFlowChart.tsx`:

```tsx
"use client";

import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthPoint } from "@/features/dashboard/queries/homeCharts";

function formatRpShort(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
  return String(v);
}

const LABELS: Record<string, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  cumulativeBalance: "Saldo",
};

const CashFlowChart = ({ months }: { months: MonthPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <ComposedChart data={months} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} tickFormatter={formatRpShort} />
        <Tooltip
          contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--ui-text)" }}
          itemStyle={{ color: "var(--ui-text-2)" }}
          formatter={(value, name) => [
            `Rp ${(Number(value) || 0).toLocaleString("id-ID")}`,
            LABELS[String(name)] ?? String(name),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "var(--ui-text-2)" }}
          formatter={(value) => LABELS[String(value)] ?? String(value)}
        />
        <Bar dataKey="income" fill="#22c55e" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" fill="#ef4444" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
        <Line type="monotone" dataKey="cumulativeBalance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
export { CashFlowChart };
```

- [x] **Step 4: Create AttendanceLineChart**

Create `features/dashboard/components/charts/AttendanceLineChart.tsx`:

```tsx
"use client";

import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthPoint } from "@/features/dashboard/queries/homeCharts";

const AttendanceLineChart = ({ months }: { months: MonthPoint[] }) => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={months} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--ui-text-muted)" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--ui-text)" }}
          itemStyle={{ color: "var(--ui-text-2)" }}
          formatter={(value) => [`${value ?? 0}%`, "Kehadiran"]}
        />
        <Line
          type="monotone"
          dataKey="attendanceRate"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "#3b82f6", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
export { AttendanceLineChart };
```

- [x] **Step 5: Create SponsorDonutChart**

Create `features/dashboard/components/charts/SponsorDonutChart.tsx`:

```tsx
"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SponsorSlice } from "@/features/dashboard/queries/homeCharts";

const PALETTE = ["#eab308", "#3b82f6", "#22c55e", "#a855f7", "#9ca3af"];

const SponsorDonutChart = ({ sponsors }: { sponsors: SponsorSlice[] }) => {
  if (sponsors.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-xs text-ui-text-muted">
        Belum ada sponsor aktif
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={sponsors}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={72}
          paddingAngle={2}
          strokeWidth={0}
          isAnimationActive={false}
        >
          {sponsors.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--ui-text)" }}
          itemStyle={{ color: "var(--ui-text-2)" }}
          formatter={(value, name) => [
            `Rp ${(Number(value) || 0).toLocaleString("id-ID")}`,
            String(name),
          ]}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: 11, color: "var(--ui-text-2)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
export { SponsorDonutChart };
```

- [x] **Step 6: Verify diagnostics clean**

Run: `rtk npm run typecheck`
Expected: exit 0.

---

### Task 5: HomeCharts grid

**Files:**
- Create: `features/dashboard/components/charts/HomeCharts.tsx`

- [x] **Step 1: Create HomeCharts**

```tsx
"use client";

import type { HomeChartData } from "@/features/dashboard/queries/homeCharts";
import { ChartCard } from "./ChartCard";
import { WinRateAreaChart } from "./WinRateAreaChart";
import { CashFlowChart } from "./CashFlowChart";
import { AttendanceLineChart } from "./AttendanceLineChart";
import { SponsorDonutChart } from "./SponsorDonutChart";

const HomeCharts = ({ data }: { data: HomeChartData }) => {
  const scrimEmpty = data.months.every((m) => m.scrimCount === 0);
  const attendanceEmpty = data.months.every((m) => m.attendanceRate === 0);
  const financeEmpty = data.months.every(
    (m) => m.income === 0 && m.expense === 0 && m.cumulativeBalance === 0,
  );
  const totalSponsor = data.sponsors.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <ChartCard title="Win Rate Trend" subtitle="6 bulan terakhir" isEmpty={scrimEmpty}>
        <WinRateAreaChart months={data.months} />
      </ChartCard>
      <ChartCard title="Cash Flow" subtitle="Pemasukan vs pengeluaran + saldo berjalan" isEmpty={financeEmpty}>
        <CashFlowChart months={data.months} />
      </ChartCard>
      <ChartCard title="Attendance Trend" subtitle="Rata-rata kehadiran scrim per bulan" isEmpty={attendanceEmpty}>
        <AttendanceLineChart months={data.months} />
      </ChartCard>
      <ChartCard
        title="Sponsor Portfolio"
        subtitle={totalSponsor > 0 ? `Total Rp ${totalSponsor.toLocaleString("id-ID")}` : "Deal aktif per sponsor"}
      >
        <SponsorDonutChart sponsors={data.sponsors} />
      </ChartCard>
    </div>
  );
};
export { HomeCharts };
```

- [x] **Step 2: Verify diagnostics clean**

Run: `rtk npm run typecheck`
Expected: exit 0.

---

### Task 6: Page wiring + gates + final commit

**Files:**
- Modify: `app/dashboard/(panel)/page.tsx`

- [x] **Step 1: Wire query + components into the page**

Add imports:

```tsx
import { HomeCharts } from "@/features/dashboard/components/charts/HomeCharts";
import { getHomeChartData, type HomeChartData } from "@/features/dashboard/queries/homeCharts";
```

Replace the health/summary fetch block (currently `let healthScore = null; let executiveSummary = null; ...`):

```tsx
  let healthScore = null;
  let executiveSummary = null;
  let homeChartData: HomeChartData | null = null;
  if (healthOrgId) {
    try {
      [healthScore, executiveSummary, homeChartData] = await Promise.all([
        getTeamHealthScore(healthOrgId),
        getExecutiveSummary(healthOrgId),
        getHomeChartData(healthOrgId),
      ]);
    } catch (e) {
      console.error("Failed to fetch dashboard stats:", e);
    }
  }
```

Replace the Executive Summary JSX block:

```tsx
        {executiveSummary && (
          <div className="space-y-4">
            {orgs && orgs.length > 1 && (
              <OrgSwitcher
                orgs={orgs}
                currentOrgId={healthOrgId ?? ""}
                basePath="/dashboard"
              />
            )}
            <ExecutiveSummary
              summary={executiveSummary}
              orgName={healthOrgName}
              chartData={homeChartData ?? undefined}
            />
            {homeChartData && <HomeCharts data={homeChartData} />}
          </div>
        )}
```

- [ ] **Step 2: Manual verification (both themes)**

Run dev server, open `/dashboard` as owner:
- Metric cards show sparklines for Win Rate / Attendance / Saldo Kas (when data varies).
- 2Ã—2 chart grid renders below cards; org switcher updates charts.
- Toggle theme (light/dark): grid lines, axis labels, tooltips follow theme.
- Org with no data: "Belum ada data" overlays + "Belum ada sponsor aktif".

- [x] **Step 3: Pre-commit gate**

```bash
rtk npm run lint
rtk npm run typecheck
rtk npm run test:unit:coverage
```

All must pass (lint: no errors; typecheck exit 0; tests pass + thresholds met).

- [x] **Step 4: Commit + push**

```bash
rtk git add features/dashboard/components/charts features/dashboard/components/ExecutiveSummary.tsx "app/dashboard/(panel)/page.tsx"
rtk git commit -m "feat: add corporate charts to owner home dashboard"
rtk git push
```
