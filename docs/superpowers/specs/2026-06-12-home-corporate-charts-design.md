# Home Corporate Charts — Design

**Date:** 2026-06-12
**Status:** Approved
**Scope:** Owner dashboard Home page (`app/dashboard/(panel)/page.tsx`) — Executive Summary area

## Goal

Upgrade the Executive Summary from static metric cards to a corporate-style analytics view:
metric cards gain mini sparklines, and a 2×2 chart grid is added below them. All charts are
theme-aware (dark + light) using existing CSS variables.

## Decisions (from brainstorming)

- Layout: keep metric cards, add sparklines inside them, add chart grid below (Stripe/Linear style).
- Chart library: recharts 3.8.1 (already installed, used in reports/audit).
- Theming: CSS variables (`var(--ui-border)`, `var(--ui-text-muted)`, `var(--ui-surface)`,
  `var(--ui-text)`) directly in recharts props — no JS theme detection needed.
- Accent data colors are fixed across themes: green `#22c55e`, red `#ef4444`, blue `#3b82f6`,
  yellow `#eab308`. Donut palette rotates yellow/blue/green/purple/gray.

## 1. Data Layer

New file: `features/dashboard/queries/homeCharts.ts` (`import "server-only"`).

```ts
export interface MonthPoint {
  monthLabel: string;        // "Jan", "Feb" — id-ID short month
  monthKey: string;          // "2026-01" for bucketing
  winRate: number;           // 0–100, 0 when no completed scrims that month
  scrimCount: number;        // completed scrims that month
  attendanceRate: number;    // 0–100, confirmed / total attendance rows
  income: number;
  expense: number;
  cumulativeBalance: number; // running balance incl. pre-window offset
}

export interface SponsorSlice {
  name: string;
  value: number;             // deal_value
}

export interface HomeChartData {
  months: MonthPoint[];      // exactly 6, oldest → newest
  sponsors: SponsorSlice[];
}

export async function getHomeChartData(orgId: string): Promise<HomeChartData>
```

Queries (admin client, parallel, explicit columns, `.limit()`, errors `console.error`d):

1. `scrims`: `id, scheduled_at, status, scrim_results(is_win)` — `organization_id = orgId`,
   `scheduled_at >= windowStart`, **all statuses**, limit 200. Win-rate bucketing uses only
   the `status === "completed"` subset; attendance uses all of them.
2. `scrim_attendances`: `status, scrim_id` — `.in("scrim_id", ids)` of the window scrims
   above, limit 1000. Bucketed by parent scrim's `scheduled_at` month.
3. `finances`: `type, amount, date` — `organization_id = orgId`, limit 500 (no date filter —
   pre-window rows feed the cumulative offset).
4. `sponsors`: `name, deal_value` — `organization_id = orgId`, `status = active`, limit 50.

Window: last 6 calendar months including current, via date-fns (`subMonths`, `startOfMonth`,
`format`).

Aggregation lives in **pure exported functions** (unit-testable):

- `buildMonthKeys(now: Date): string[]` — 6 month keys oldest→newest
- `bucketScrims(scrims, monthKeys)` — per-month wins/total → winRate, scrimCount
- `bucketAttendance(attendances, scrimMonthMap, monthKeys)` — per-month confirmed/total
- `bucketFinances(finances, monthKeys)` — per-month income/expense + cumulative balance with
  pre-window offset (sum of all transactions dated before window start)

`getHomeChartData` is a thin wrapper composing these.

## 2. Sparklines in Metric Cards

`ExecutiveSummary.tsx` changes:

- `MetricCard` gains optional prop `trend?: number[]` (6 monthly points) and
  `trendColor?: string`.
- When `trend` present and has ≥2 non-identical points, render mini sparkline under the value:
  recharts `AreaChart` height ~28px, no axes/grid/tooltip, stroke = trendColor,
  gradient fill fading to transparent, `isAnimationActive={false}`.
- Sparkline cards: **Win Rate** (winRate series, green), **Attendance** (attendanceRate series,
  blue), **Saldo Kas** (cumulativeBalance series, green/red by final sign).
- Member Aktif, Sponsor Aktif, Nilai Sponsor: unchanged (no meaningful historical series).
- `ExecutiveSummary` component gains optional prop `chartData?: HomeChartData` — sparklines
  only render when provided (backward compatible).
- Because sparklines use recharts, `ExecutiveSummary` (or an extracted `Sparkline` child)
  must be a client component. Extract `Sparkline.tsx` as `"use client"` and keep
  `ExecutiveSummary` a server-compatible component that renders it.

## 3. Chart Grid

New directory: `features/dashboard/components/charts/`

- `ChartCard.tsx` — wrapper: `rounded-xl border border-ui-border bg-ui-surface p-4`,
  title (text-sm font-semibold text-ui-text) + optional subtitle (text-xs text-ui-text-muted).
- `HomeCharts.tsx` (`"use client"`) — `grid grid-cols-1 lg:grid-cols-2 gap-3`, renders the
  four charts from `HomeChartData` props.
- `WinRateAreaChart.tsx` — AreaChart, monotone, green stroke, gradient fill, Y domain [0, 100],
  tooltip "Win Rate: N%" + "N scrim".
- `CashFlowChart.tsx` — ComposedChart: Bar income (green), Bar expense (red), Line
  cumulativeBalance (blue, dot). Y tick formatter compact Rupiah (`jt`/`rb`). Legend in
  Indonesian (Pemasukan / Pengeluaran / Saldo).
- `AttendanceLineChart.tsx` — LineChart, blue, dots, Y domain [0, 100].
- `SponsorDonutChart.tsx` — PieChart `innerRadius`/`outerRadius` donut, palette rotation
  `["#eab308", "#3b82f6", "#22c55e", "#a855f7", "#9ca3af"]`, legend with sponsor names,
  center label total value. Empty state: centered text "Belum ada sponsor aktif".
- All charts: CartesianGrid `stroke="var(--ui-border)"` `vertical={false}`, axis ticks
  `fill: "var(--ui-text-muted)"` fontSize 11, no axisLine/tickLine, Tooltip
  `contentStyle={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 8, fontSize: 12 }}`
  `labelStyle={{ color: "var(--ui-text)" }}` `itemStyle={{ color: "var(--ui-text-2)" }}`.
- Charts with all-zero data still render axes plus muted "Belum ada data" overlay.

## 4. Page Wiring

`app/dashboard/(panel)/page.tsx`:

- Add `getHomeChartData(healthOrgId)` to the existing
  `Promise.all([getTeamHealthScore, getExecutiveSummary])`.
- Pass `chartData` to `<ExecutiveSummary>`; render `<HomeCharts data={chartData} />`
  inside the same Executive Summary block (below the cards) so it switches with the
  org switcher.
- Wrap in the existing try/catch; on failure charts simply don't render.

## 5. Error Handling

- Query errors logged, fall back to empty arrays → charts render empty states, page never
  crashes.
- Division by zero guarded in all rate calcs (0 when denominator 0).
- `deal_value` nullable → coalesce 0; sponsors with 0 value excluded from donut.

## 6. Testing

- Unit tests (vitest) for pure functions in `homeCharts.ts`: month key generation (year
  boundary), scrim bucketing (win rate calc, empty month), attendance bucketing, finance
  bucketing (cumulative offset with pre-window transactions, expense sign).
- Coverage gate: new query file logic fully covered (statements 80 / branches 75 thresholds).
- Manual: verify both themes (light + dark) render correctly, org switcher updates charts.

## Out of Scope

- Manager panel (`/manage`) charts.
- Fixing hardcoded dark colors in existing reports charts.
- Historical member-count or sponsor-count series.
