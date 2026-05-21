# Reports Page Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `/dashboard/reports` and `/manage/reports` from a basic monthly summary into a full tabbed dashboard (Overview, Scrim, Tournament, Finance, Sponsor) with 6-month trend charts, per-division breakdown, sponsor tracking, and an upgraded multi-page PDF export.

**Architecture:** All data is fetched server-side in `generateMonthlyReport()` and passed as props to `ReportView` (client component), which handles tab switching via `useState`. Chart sub-components are separate `"use client"` leaf components using Recharts. Finance and Sponsor data is `null` for manager role, hiding those tabs.

**Tech Stack:** Next.js 15 App Router, Supabase (admin client), Recharts (already installed), jsPDF (already installed), TypeScript strict, Tailwind CSS v4.

---

## File Map

**Modify:**
- `features/reports/queries.ts` — expand `MonthlyReport` type + `generateMonthlyReport()`
- `features/reports/components/ReportView.tsx` — tabbed layout + expanded PDF
- `app/dashboard/(panel)/reports/page.tsx` — pass `role='owner'`
- `app/manage/reports/page.tsx` — pass `role='manager'`

**Create:**
- `features/reports/components/charts/WinRateTrendChart.tsx`
- `features/reports/components/charts/FinanceTrendChart.tsx`
- `features/reports/components/tabs/OverviewTab.tsx`
- `features/reports/components/tabs/ScrimTab.tsx`
- `features/reports/components/tabs/TournamentTab.tsx`
- `features/reports/components/tabs/FinanceTab.tsx`
- `features/reports/components/tabs/SponsorTab.tsx`

---

## Task 1: Expand MonthlyReport type and query

**Files:**
- Modify: `features/reports/queries.ts`

- [ ] **Step 1: Replace the file with expanded types and query**

```typescript
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrendPoint {
  monthLabel: string; // e.g. "Jan 26"
  winRate: number;
  total: number;
}

export interface FinanceTrendPoint {
  monthLabel: string;
  income: number;
  expense: number;
}

export interface AttendanceTrendPoint {
  monthLabel: string;
  avgRate: number;
}

export interface MonthlyReport {
  month: string;
  year: number;
  role: "owner" | "manager";

  scrims: {
    total: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    byDivision: Array<{
      divisionId: string | null;
      divisionName: string;
      total: number;
      wins: number;
      losses: number;
      draws: number;
      winRate: number;
    }>;
    list: Array<{
      id: string;
      scheduledAt: string;
      opponentName: string;
      format: string;
      divisionName: string | null;
      isWin: boolean | null;
    }>;
  };

  tournaments: {
    total: number;
    ongoing: number;
    completed: number;
    list: Array<{
      id: string;
      name: string;
      status: string;
      startDate: string;
      divisionName: string | null;
      stages: Array<{
        stageId: string;
        stageName: string;
        wins: number;
        losses: number;
        isCompleted: boolean;
      }>;
    }>;
  };

  attendance: {
    totalMembers: number;
    avgAttendanceRate: number;
  };

  // null for manager role
  finances: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    incomeList: Array<{ description: string | null; category: string; date: string; amount: number }>;
    expenseList: Array<{ description: string | null; category: string; date: string; amount: number }>;
  } | null;

  // null for manager role
  sponsors: {
    total: number;
    active: number;
    prospect: number;
    list: Array<{
      id: string;
      name: string;
      status: string;
      startDate: string | null;
      dealValue: number | null;
      currency: string;
      notes: string | null;
    }>;
    totalActiveValue: number;
  } | null;

  trend: {
    scrimWinRate: TrendPoint[];           // last 6 months
    finance: FinanceTrendPoint[] | null;  // null for manager
    attendance: AttendanceTrendPoint[];   // last 6 months
  };

  activity: {
    scrimsScheduled: number;
    tournamentsActive: number;
    sponsorsActive: number | null; // null for manager
    membersActive: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function monthLabel(y: number, m: number) {
  return `${MONTH_NAMES_SHORT[m - 1]} ${String(y).slice(2)}`;
}

// Returns [{ year, month }] for last 6 months ending at (year, month)
function last6Months(year: number, month: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
}

// ── Main query ────────────────────────────────────────────────────────────────

export async function generateMonthlyReport(
  orgId: string,
  year: number,
  month: number,
  role: "owner" | "manager" = "owner",
): Promise<MonthlyReport> {
  const admin = createAdminClient();

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  // ── 1. Scrims for this month ───────────────────────────────────────────────
  const { data: scrims } = await admin
    .from("scrims")
    .select("id, status, opponent_name, format, division_id, scheduled_at")
    .eq("organization_id", orgId)
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate);

  const completedScrims = (scrims ?? []).filter((s) => s.status === "completed");
  const completedIds = completedScrims.map((s) => s.id);

  // ── 2. Scrim results ──────────────────────────────────────────────────────
  let resultMap = new Map<string, boolean | null>();
  if (completedIds.length > 0) {
    const { data: results } = await admin
      .from("scrim_results")
      .select("scrim_id, is_win")
      .in("scrim_id", completedIds);
    for (const r of results ?? []) {
      resultMap.set(r.scrim_id, r.is_win);
    }
  }

  // ── 3. Divisions ──────────────────────────────────────────────────────────
  const divisionIds = [...new Set((scrims ?? []).map((s) => s.division_id).filter(Boolean))] as string[];
  let divisionNameMap = new Map<string, string>();
  if (divisionIds.length > 0) {
    const { data: divs } = await admin
      .from("divisions")
      .select("id, name")
      .in("id", divisionIds);
    for (const d of divs ?? []) divisionNameMap.set(d.id, d.name);
  }

  // ── 4. Scrim aggregation ──────────────────────────────────────────────────
  let wins = 0, losses = 0, draws = 0;
  const divMap = new Map<string, { divisionId: string | null; divisionName: string; total: number; wins: number; losses: number; draws: number }>();

  for (const s of completedScrims) {
    const isWin = resultMap.get(s.id) ?? null;
    if (isWin === true) wins++;
    else if (isWin === false) losses++;
    else draws++;

    const divKey = s.division_id ?? "__none__";
    const divName = s.division_id ? (divisionNameMap.get(s.division_id) ?? "Divisi Lain") : "Tanpa Divisi";
    const cur = divMap.get(divKey) ?? { divisionId: s.division_id ?? null, divisionName: divName, total: 0, wins: 0, losses: 0, draws: 0 };
    cur.total++;
    if (isWin === true) cur.wins++;
    else if (isWin === false) cur.losses++;
    else cur.draws++;
    divMap.set(divKey, cur);
  }

  const total = completedScrims.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const byDivision = [...divMap.values()]
    .sort((a, b) => b.total - a.total)
    .map((d) => ({
      ...d,
      winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0,
    }));

  const scrimList = completedScrims.map((s) => ({
    id: s.id,
    scheduledAt: s.scheduled_at,
    opponentName: s.opponent_name,
    format: s.format,
    divisionName: s.division_id ? (divisionNameMap.get(s.division_id) ?? null) : null,
    isWin: resultMap.get(s.id) ?? null,
  })).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  // ── 5. Attendance ─────────────────────────────────────────────────────────
  const allScrimIds = (scrims ?? []).map((s) => s.id);
  let avgAttendanceRate = 0;
  if (allScrimIds.length > 0) {
    const { data: attendances } = await admin
      .from("scrim_attendances")
      .select("status")
      .in("scrim_id", allScrimIds);
    const total = (attendances ?? []).length;
    const confirmed = (attendances ?? []).filter((a) => a.status === "confirmed").length;
    avgAttendanceRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  }

  const { count: memberCount } = await admin
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("is_active", true);

  // ── 6. Tournaments this month ─────────────────────────────────────────────
  const { data: tournamentsRaw } = await admin
    .from("tournaments")
    .select("id, name, status, start_date, division_id")
    .eq("organization_id", orgId)
    .gte("start_date", `${year}-${String(month).padStart(2, "0")}-01`)
    .lte("start_date", `${year}-${String(month).padStart(2, "0")}-31`);

  const tournamentDivIds = [...new Set((tournamentsRaw ?? []).map((t) => t.division_id).filter(Boolean))] as string[];
  let tournamentDivMap = new Map<string, string>();
  if (tournamentDivIds.length > 0) {
    const { data: tDivs } = await admin.from("divisions").select("id, name").in("id", tournamentDivIds);
    for (const d of tDivs ?? []) tournamentDivMap.set(d.id, d.name);
  }

  const tournamentIds = (tournamentsRaw ?? []).map((t) => t.id);
  let stagesByTournament = new Map<string, Array<{ id: string; stage_name: string; is_completed: boolean }>>();
  let matchesByStage = new Map<string, Array<{ is_win: boolean | null }>>();

  if (tournamentIds.length > 0) {
    const { data: stages } = await admin
      .from("tournament_stages")
      .select("id, tournament_id, stage_name, is_completed")
      .in("tournament_id", tournamentIds);

    for (const s of stages ?? []) {
      const arr = stagesByTournament.get(s.tournament_id) ?? [];
      arr.push(s);
      stagesByTournament.set(s.tournament_id, arr);
    }

    const stageIds = (stages ?? []).map((s) => s.id);
    if (stageIds.length > 0) {
      // tournament_matches not in generated types — use any cast
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matches } = await (admin as any)
        .from("tournament_matches")
        .select("stage_id, is_win")
        .in("stage_id", stageIds);
      for (const m of (matches ?? []) as { stage_id: string; is_win: boolean | null }[]) {
        const arr = matchesByStage.get(m.stage_id) ?? [];
        arr.push({ is_win: m.is_win });
        matchesByStage.set(m.stage_id, arr);
      }
    }
  }

  const tournamentList = (tournamentsRaw ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    startDate: t.start_date,
    divisionName: t.division_id ? (tournamentDivMap.get(t.division_id) ?? null) : null,
    stages: (stagesByTournament.get(t.id) ?? []).map((s) => {
      const matches = matchesByStage.get(s.id) ?? [];
      return {
        stageId: s.id,
        stageName: s.stage_name,
        isCompleted: s.is_completed,
        wins: matches.filter((m) => m.is_win === true).length,
        losses: matches.filter((m) => m.is_win === false).length,
      };
    }),
  }));

  const tournaments = {
    total: tournamentList.length,
    ongoing: tournamentList.filter((t) => t.status === "ongoing").length,
    completed: tournamentList.filter((t) => t.status === "completed").length,
    list: tournamentList,
  };

  // ── 7. Finances (owner only) ──────────────────────────────────────────────
  let finances: MonthlyReport["finances"] = null;
  if (role === "owner") {
    const { data: finData } = await admin
      .from("finances")
      .select("type, amount, description, category, date")
      .eq("organization_id", orgId)
      .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
      .lte("date", `${year}-${String(month).padStart(2, "0")}-31`)
      .order("date", { ascending: false });

    let totalIncome = 0, totalExpense = 0;
    const incomeList: NonNullable<MonthlyReport["finances"]>["incomeList"] = [];
    const expenseList: NonNullable<MonthlyReport["finances"]>["expenseList"] = [];

    for (const f of finData ?? []) {
      const entry = { description: f.description, category: f.category, date: f.date, amount: f.amount };
      if (f.type === "income") { totalIncome += f.amount; incomeList.push(entry); }
      else { totalExpense += f.amount; expenseList.push(entry); }
    }
    finances = { totalIncome, totalExpense, balance: totalIncome - totalExpense, incomeList, expenseList };
  }

  // ── 8. Sponsors (owner only) ──────────────────────────────────────────────
  let sponsors: MonthlyReport["sponsors"] = null;
  if (role === "owner") {
    const { data: sponsorData } = await admin
      .from("sponsors")
      .select("id, name, status, start_date, deal_value, currency, notes")
      .eq("organization_id", orgId)
      .order("status")
      .order("name");

    const active = (sponsorData ?? []).filter((s) => s.status === "active");
    sponsors = {
      total: (sponsorData ?? []).length,
      active: active.length,
      prospect: (sponsorData ?? []).filter((s) => s.status === "prospect").length,
      list: (sponsorData ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        startDate: s.start_date,
        dealValue: s.deal_value,
        currency: s.currency,
        notes: s.notes,
      })),
      totalActiveValue: active.reduce((sum, s) => sum + (s.deal_value ?? 0), 0),
    };
  }

  // ── 9. Trend (last 6 months) ──────────────────────────────────────────────
  const trendMonths = last6Months(year, month);
  const trendStart = new Date(trendMonths[0].year, trendMonths[0].month - 1, 1).toISOString();
  const trendEnd = new Date(year, month, 0, 23, 59, 59).toISOString();

  const [{ data: trendScrims }, { data: trendFinData }, { data: trendAttData }] = await Promise.all([
    admin.from("scrims").select("id, scheduled_at, status")
      .eq("organization_id", orgId)
      .gte("scheduled_at", trendStart)
      .lte("scheduled_at", trendEnd),
    role === "owner"
      ? admin.from("finances").select("type, amount, date")
          .eq("organization_id", orgId)
          .gte("date", `${trendMonths[0].year}-${String(trendMonths[0].month).padStart(2, "0")}-01`)
          .lte("date", `${year}-${String(month).padStart(2, "0")}-31`)
      : Promise.resolve({ data: [] as null }),
    admin.from("scrim_attendances").select("scrim_id, status")
      .in("scrim_id", (trendScrims ?? []).map((s) => s.id).length > 0
        ? (trendScrims ?? []).map((s) => s.id)
        : ["__none__"]),
  ]);

  // Group trend by month
  const completedTrendScrims = (trendScrims ?? []).filter((s) => s.status === "completed");
  const trendResultIds = completedTrendScrims.map((s) => s.id);
  let trendResultMap = new Map<string, boolean | null>();
  if (trendResultIds.length > 0) {
    const { data: trendResults } = await admin
      .from("scrim_results").select("scrim_id, is_win").in("scrim_id", trendResultIds);
    for (const r of trendResults ?? []) trendResultMap.set(r.scrim_id, r.is_win);
  }

  const scrimWinRate: TrendPoint[] = trendMonths.map(({ year: y, month: m }) => {
    const monthScrims = completedTrendScrims.filter((s) => {
      const d = new Date(s.scheduled_at);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
    const mWins = monthScrims.filter((s) => trendResultMap.get(s.id) === true).length;
    const mTotal = monthScrims.length;
    return { monthLabel: monthLabel(y, m), winRate: mTotal > 0 ? Math.round((mWins / mTotal) * 100) : 0, total: mTotal };
  });

  const financeTrend: FinanceTrendPoint[] | null = role === "owner"
    ? trendMonths.map(({ year: y, month: m }) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        const prefix = `${y}-${pad(m)}`;
        const monthFin = (trendFinData ?? []) as Array<{ type: string; amount: number; date: string }>;
        const income = monthFin.filter((f) => f.date.startsWith(prefix) && f.type === "income").reduce((s, f) => s + f.amount, 0);
        const expense = monthFin.filter((f) => f.date.startsWith(prefix) && f.type === "expense").reduce((s, f) => s + f.amount, 0);
        return { monthLabel: monthLabel(y, m), income, expense };
      })
    : null;

  const attendanceTrend: AttendanceTrendPoint[] = trendMonths.map(({ year: y, month: m }) => {
    const monthScrimIds = (trendScrims ?? [])
      .filter((s) => { const d = new Date(s.scheduled_at); return d.getFullYear() === y && d.getMonth() + 1 === m; })
      .map((s) => s.id);
    const monthAtt = (trendAttData ?? []).filter((a) => monthScrimIds.includes(a.scrim_id));
    const mTotal = monthAtt.length;
    const mConfirmed = monthAtt.filter((a) => a.status === "confirmed").length;
    return { monthLabel: monthLabel(y, m), avgRate: mTotal > 0 ? Math.round((mConfirmed / mTotal) * 100) : 0 };
  });

  // ── 10. Activity ──────────────────────────────────────────────────────────
  const activity = {
    scrimsScheduled: (scrims ?? []).length,
    tournamentsActive: tournaments.ongoing,
    sponsorsActive: sponsors?.active ?? null,
    membersActive: memberCount ?? 0,
  };

  return {
    month: MONTH_NAMES[month - 1] ?? "",
    year,
    role,
    scrims: { total, wins, losses, draws, winRate, byDivision, list: scrimList },
    tournaments,
    attendance: { totalMembers: memberCount ?? 0, avgAttendanceRate },
    finances,
    sponsors,
    trend: { scrimWinRate, finance: financeTrend, attendance: attendanceTrend },
    activity,
  };
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: No errors related to `features/reports/queries.ts`

- [ ] **Step 3: Commit**

```bash
rtk git add features/reports/queries.ts
rtk git commit -m "feat(reports): expand MonthlyReport type with tournaments, sponsors, trend data"
```

---

## Task 2: Trend chart client components

**Files:**
- Create: `features/reports/components/charts/WinRateTrendChart.tsx`
- Create: `features/reports/components/charts/FinanceTrendChart.tsx`

- [ ] **Step 1: Create WinRateTrendChart**

```tsx
// features/reports/components/charts/WinRateTrendChart.tsx
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { TrendPoint } from "@/features/reports/queries";

export function WinRateTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#6B6A68" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B6A68" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#202020", border: "1px solid #2D2D2D", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#E5E2E1" }}
          formatter={(v: number) => [`${v}%`, "Win Rate"]}
        />
        <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.winRate >= 50 ? "#22c55e" : "#ef4444"} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create FinanceTrendChart**

```tsx
// features/reports/components/charts/FinanceTrendChart.tsx
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { FinanceTrendPoint } from "@/features/reports/queries";

function formatRp(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

export function FinanceTrendChart({ data }: { data: FinanceTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: "#6B6A68" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6B6A68" }} axisLine={false} tickLine={false} tickFormatter={formatRp} />
        <Tooltip
          contentStyle={{ background: "#202020", border: "1px solid #2D2D2D", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#E5E2E1" }}
          formatter={(v: number, name: string) => [`Rp ${v.toLocaleString("id-ID")}`, name === "income" ? "Pemasukan" : "Pengeluaran"]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#9B9A97" }} formatter={(v) => v === "income" ? "Pemasukan" : "Pengeluaran"} />
        <Bar dataKey="income" fill="#22c55e" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" fill="#ef4444" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
rtk git add features/reports/components/charts/
rtk git commit -m "feat(reports): add WinRateTrendChart and FinanceTrendChart with Recharts"
```

---

## Task 3: OverviewTab component

**Files:**
- Create: `features/reports/components/tabs/OverviewTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
// features/reports/components/tabs/OverviewTab.tsx
import { Trophy, Users, BarChart3, DollarSign, Calendar, Handshake } from "lucide-react";
import { WinRateTrendChart } from "@/features/reports/components/charts/WinRateTrendChart";
import { FinanceTrendChart } from "@/features/reports/components/charts/FinanceTrendChart";
import type { MonthlyReport } from "@/features/reports/queries";

function StatCard({ label, value, sub, color = "default" }: {
  label: string; value: string; sub: string; color?: "green" | "red" | "blue" | "yellow" | "default";
}) {
  const valueClass = {
    green: "text-emerald-400", red: "text-rose-400", blue: "text-blue-400",
    yellow: "text-yellow-400", default: "text-[#E5E2E1]",
  }[color];
  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-[#9B9A97]">{sub}</p>
    </div>
  );
}

interface OverviewTabProps {
  report: MonthlyReport;
}

export function OverviewTab({ report }: OverviewTabProps) {
  const { scrims, tournaments, attendance, finances, sponsors, trend, activity } = report;

  return (
    <div className="space-y-6">
      {/* Row 1 — 4 stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Scrim Win Rate"
          value={`${scrims.winRate}%`}
          sub={`${scrims.wins}W · ${scrims.losses}L · ${scrims.draws}D`}
          color={scrims.winRate >= 50 ? "green" : "red"}
        />
        <StatCard
          label="Turnamen"
          value={String(tournaments.total)}
          sub={`${tournaments.ongoing} berjalan · ${tournaments.completed} selesai`}
          color="yellow"
        />
        <StatCard
          label="Kehadiran"
          value={`${attendance.avgAttendanceRate}%`}
          sub="rata-rata kehadiran scrim"
          color="blue"
        />
        {finances ? (
          <StatCard
            label="Saldo Kas"
            value={`Rp ${Math.abs(finances.balance).toLocaleString("id-ID")}`}
            sub={finances.balance >= 0 ? "surplus" : "defisit"}
            color={finances.balance >= 0 ? "green" : "red"}
          />
        ) : (
          <StatCard
            label="Member Aktif"
            value={String(attendance.totalMembers)}
            sub="anggota terdaftar"
          />
        )}
      </div>

      {/* Row 2 — Win rate trend */}
      <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
          Tren Win Rate Scrim (6 Bulan)
        </p>
        <WinRateTrendChart data={trend.scrimWinRate} />
      </div>

      {/* Row 3 — Finance/attendance trend + activity */}
      <div className="grid gap-4 sm:grid-cols-2">
        {trend.finance ? (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
              Tren Keuangan (6 Bulan)
            </p>
            <FinanceTrendChart data={trend.finance} />
          </div>
        ) : (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
              Tren Kehadiran (6 Bulan)
            </p>
            <div className="space-y-2 pt-1">
              {trend.attendance.map((p) => (
                <div key={p.monthLabel} className="flex items-center gap-3">
                  <span className="w-12 text-[11px] text-[#6B6A68]">{p.monthLabel}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#252525] overflow-hidden">
                    <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${p.avgRate}%` }} />
                  </div>
                  <span className="w-9 text-right text-[11px] text-[#9B9A97]">{p.avgRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
            Aktivitas Bulan Ini
          </p>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-3 text-sm">
              <Trophy className="h-4 w-4 text-[#6B6A68] shrink-0" />
              <span className="text-[#9B9A97]">Scrim dijadwalkan</span>
              <span className="ml-auto font-semibold text-[#E5E2E1]">{activity.scrimsScheduled}</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-[#6B6A68] shrink-0" />
              <span className="text-[#9B9A97]">Turnamen aktif</span>
              <span className="ml-auto font-semibold text-[#E5E2E1]">{activity.tournamentsActive}</span>
            </li>
            {activity.sponsorsActive !== null && (
              <li className="flex items-center gap-3 text-sm">
                <Handshake className="h-4 w-4 text-[#6B6A68] shrink-0" />
                <span className="text-[#9B9A97]">Sponsor aktif</span>
                <span className="ml-auto font-semibold text-[#E5E2E1]">{activity.sponsorsActive}</span>
              </li>
            )}
            <li className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-[#6B6A68] shrink-0" />
              <span className="text-[#9B9A97]">Member aktif</span>
              <span className="ml-auto font-semibold text-[#E5E2E1]">{activity.membersActive}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add features/reports/components/tabs/OverviewTab.tsx
rtk git commit -m "feat(reports): OverviewTab with stat cards and trend charts"
```

---

## Task 4: ScrimTab component

**Files:**
- Create: `features/reports/components/tabs/ScrimTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
// features/reports/components/tabs/ScrimTab.tsx
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { MonthlyReport } from "@/features/reports/queries";

const FORMAT_LABELS: Record<string, string> = {
  bo1: "BO1", bo2: "BO2", bo3: "BO3", bo5: "BO5", bo7: "BO7", "4match": "4 Match",
};

interface ScrimTabProps {
  report: MonthlyReport;
}

export function ScrimTab({ report }: ScrimTabProps) {
  const { scrims } = report;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: scrims.total, sub: "scrim selesai", cls: "text-[#E5E2E1]" },
          { label: "Menang", value: scrims.wins, sub: "kemenangan", cls: "text-emerald-400" },
          { label: "Kalah", value: scrims.losses, sub: "kekalahan", cls: "text-rose-400" },
          { label: "Seri", value: scrims.draws, sub: "draw", cls: "text-[#9B9A97]" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">{c.label}</p>
            <p className={`text-2xl font-bold ${c.cls}`}>{c.value}</p>
            <p className="text-xs text-[#9B9A97]">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Win rate bar */}
      {scrims.total > 0 && (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9B9A97]">Win Rate</span>
            <span className={`font-bold ${scrims.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
              {scrims.winRate}%
            </span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-[#252525]">
            <div className="h-full bg-emerald-500/60" style={{ width: `${(scrims.wins / scrims.total) * 100}%` }} />
            <div className="h-full bg-zinc-500/40" style={{ width: `${(scrims.draws / scrims.total) * 100}%` }} />
            <div className="h-full bg-rose-500/60" style={{ width: `${(scrims.losses / scrims.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Per-division breakdown — only show if >1 division or any "no division" */}
      {scrims.byDivision.length > 1 && (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2D2D2D]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">Per Divisi</p>
          </div>
          <div className="divide-y divide-[#2D2D2D]">
            {scrims.byDivision.map((div) => (
              <div key={div.divisionId ?? "__none__"} className="px-5 py-3 grid grid-cols-[1fr_auto_auto_auto_120px] items-center gap-4">
                <span className="text-sm text-[#E5E2E1] truncate">{div.divisionName}</span>
                <span className="text-xs text-[#9B9A97] w-8 text-center">{div.total}</span>
                <span className="text-xs text-emerald-400 w-6 text-center">{div.wins}W</span>
                <span className="text-xs text-rose-400 w-6 text-center">{div.losses}L</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[#252525] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${div.winRate >= 50 ? "bg-emerald-500/60" : "bg-rose-500/60"}`}
                      style={{ width: `${div.winRate}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold w-9 text-right ${div.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                    {div.winRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scrim list */}
      {scrims.list.length > 0 && (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2D2D2D]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
              Daftar Scrim Bulan Ini
            </p>
          </div>
          <div className="divide-y divide-[#2D2D2D]">
            {scrims.list.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-2.5">
                {s.isWin === true
                  ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  : s.isWin === false
                  ? <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  : <MinusCircle className="h-4 w-4 shrink-0 text-[#6B6A68]" />}
                <span className="text-sm text-[#E5E2E1] truncate flex-1">vs {s.opponentName}</span>
                <span className="text-[11px] text-[#6B6A68] shrink-0">
                  {FORMAT_LABELS[s.format] ?? s.format.toUpperCase()}
                </span>
                {s.divisionName && (
                  <span className="text-[10px] bg-[#252525] text-[#9B9A97] px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
                    {s.divisionName}
                  </span>
                )}
                <span className="text-[11px] text-[#6B6A68] shrink-0">
                  {format(new Date(s.scheduledAt), "d MMM", { locale: idLocale })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {scrims.total === 0 && (
        <p className="text-sm text-[#6B6A68] text-center py-8">Tidak ada scrim di bulan ini.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add features/reports/components/tabs/ScrimTab.tsx
rtk git commit -m "feat(reports): ScrimTab with per-division breakdown and scrim list"
```

---

## Task 5: TournamentTab component

**Files:**
- Create: `features/reports/components/tabs/TournamentTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
// features/reports/components/tabs/TournamentTab.tsx
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { MonthlyReport } from "@/features/reports/queries";

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Akan Datang",
  ongoing: "Berjalan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_CLASS: Record<string, string> = {
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ongoing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

interface TournamentTabProps {
  report: MonthlyReport;
}

export function TournamentTab({ report }: TournamentTabProps) {
  const { tournaments } = report;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: tournaments.total, cls: "text-[#E5E2E1]" },
          { label: "Berjalan", value: tournaments.ongoing, cls: "text-yellow-400" },
          { label: "Selesai", value: tournaments.completed, cls: "text-emerald-400" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">{c.label}</p>
            <p className={`text-2xl font-bold ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tournament cards */}
      {tournaments.list.length > 0 ? (
        <div className="space-y-3">
          {tournaments.list.map((t) => (
            <div key={t.id} className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
              <div className="flex items-start justify-between px-5 py-4 border-b border-[#2D2D2D]">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-[#E5E2E1]">{t.name}</h3>
                  <p className="text-xs text-[#6B6A68]">
                    {new Date(t.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                    {t.divisionName ? ` · ${t.divisionName}` : ""}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_CLASS[t.status] ?? STATUS_CLASS.upcoming}`}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>

              {t.stages.length > 0 && (
                <div className="px-5 py-3 space-y-2">
                  {t.stages.map((stage) => {
                    const total = stage.wins + stage.losses;
                    return (
                      <div key={stage.stageId} className="flex items-center gap-3">
                        <span className="text-xs text-[#9B9A97] w-28 truncate shrink-0">{stage.stageName}</span>
                        {total > 0 ? (
                          <>
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex gap-1">
                                {Array.from({ length: stage.wins }).map((_, i) => (
                                  <CheckCircle key={i} className="h-3.5 w-3.5 text-emerald-400" />
                                ))}
                                {Array.from({ length: stage.losses }).map((_, i) => (
                                  <XCircle key={i} className="h-3.5 w-3.5 text-rose-400" />
                                ))}
                              </div>
                              <span className="text-xs text-[#6B6A68]">
                                {stage.wins}W · {stage.losses}L
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-[#6B6A68]">
                            <Clock className="h-3.5 w-3.5" />
                            Belum dimainkan
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6B6A68] text-center py-8">
          Tidak ada turnamen yang dimulai di bulan ini.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add features/reports/components/tabs/TournamentTab.tsx
rtk git commit -m "feat(reports): TournamentTab with stage breakdown"
```

---

## Task 6: FinanceTab component

**Files:**
- Create: `features/reports/components/tabs/FinanceTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
// features/reports/components/tabs/FinanceTab.tsx
import type { MonthlyReport } from "@/features/reports/queries";

function rp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

interface FinanceTabProps {
  finances: NonNullable<MonthlyReport["finances"]>;
}

export function FinanceTab({ finances }: FinanceTabProps) {
  const usagePercent = finances.totalIncome > 0
    ? Math.min(Math.round((finances.totalExpense / finances.totalIncome) * 100), 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Pemasukan</p>
          <p className="text-xl font-bold text-emerald-400">{rp(finances.totalIncome)}</p>
          <p className="text-xs text-[#9B9A97]">{finances.incomeList.length} transaksi</p>
        </div>
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Pengeluaran</p>
          <p className="text-xl font-bold text-rose-400">{rp(finances.totalExpense)}</p>
          <p className="text-xs text-[#9B9A97]">{finances.expenseList.length} transaksi</p>
        </div>
        <div className={`rounded-xl border p-4 space-y-1 ${
          finances.balance >= 0
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-rose-500/20 bg-rose-500/5"
        }`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Saldo</p>
          <p className={`text-xl font-bold ${finances.balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {finances.balance >= 0 ? "" : "-"}{rp(Math.abs(finances.balance))}
          </p>
          <p className={`text-xs font-medium ${finances.balance >= 0 ? "text-emerald-400/70" : "text-rose-400/70"}`}>
            {finances.balance >= 0 ? "Surplus" : "Defisit"}
          </p>
        </div>
      </div>

      {/* Usage bar */}
      {finances.totalIncome > 0 && (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9B9A97]">Penggunaan dari pemasukan</span>
            <span className={`font-bold ${usagePercent >= 80 ? "text-rose-400" : "text-emerald-400"}`}>
              {usagePercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#252525] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usagePercent >= 80 ? "bg-rose-500/60" : "bg-emerald-500/60"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Transaction tables */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Income */}
        {finances.incomeList.length > 0 && (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2D2D2D]">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Pemasukan</p>
            </div>
            <div className="divide-y divide-[#2D2D2D]">
              {finances.incomeList.map((f, i) => (
                <div key={i} className="px-4 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#E5E2E1] truncate">{f.description ?? f.category}</p>
                    <p className="text-[10px] text-[#6B6A68]">{new Date(f.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 shrink-0">+{rp(f.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense */}
        {finances.expenseList.length > 0 && (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2D2D2D]">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Pengeluaran</p>
            </div>
            <div className="divide-y divide-[#2D2D2D]">
              {finances.expenseList.map((f, i) => (
                <div key={i} className="px-4 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#E5E2E1] truncate">{f.description ?? f.category}</p>
                    <p className="text-[10px] text-[#6B6A68]">{new Date(f.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                  </div>
                  <span className="text-xs font-medium text-rose-400 shrink-0">-{rp(f.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {finances.incomeList.length === 0 && finances.expenseList.length === 0 && (
        <p className="text-sm text-[#6B6A68] text-center py-8">Tidak ada transaksi di bulan ini.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add features/reports/components/tabs/FinanceTab.tsx
rtk git commit -m "feat(reports): FinanceTab with transaction tables and usage bar"
```

---

## Task 7: SponsorTab component

**Files:**
- Create: `features/reports/components/tabs/SponsorTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
// features/reports/components/tabs/SponsorTab.tsx
import type { MonthlyReport } from "@/features/reports/queries";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:   { label: "Aktif",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  prospect: { label: "Prospek",  cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  inactive: { label: "Inaktif",  cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  ended:    { label: "Berakhir", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

interface SponsorTabProps {
  sponsors: NonNullable<MonthlyReport["sponsors"]>;
}

export function SponsorTab({ sponsors }: SponsorTabProps) {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Total Sponsor</p>
          <p className="text-2xl font-bold text-[#E5E2E1]">{sponsors.total}</p>
        </div>
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Aktif</p>
          <p className="text-2xl font-bold text-emerald-400">{sponsors.active}</p>
        </div>
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Prospek</p>
          <p className="text-2xl font-bold text-blue-400">{sponsors.prospect}</p>
        </div>
      </div>

      {/* Total active value */}
      {sponsors.active > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <p className="text-xs text-[#9B9A97]">Total nilai sponsor aktif</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            Rp {sponsors.totalActiveValue.toLocaleString("id-ID")}
          </p>
        </div>
      )}

      {/* Sponsor cards */}
      {sponsors.list.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {sponsors.list.map((s) => {
            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.inactive;
            return (
              <div key={s.id} className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#E5E2E1] truncate">{s.name}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>
                {s.startDate && (
                  <p className="text-xs text-[#6B6A68]">
                    Sejak {new Date(s.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {s.dealValue != null && (
                  <p className="text-xs font-medium text-[#9B9A97]">
                    {s.currency} {s.dealValue.toLocaleString("id-ID")}
                  </p>
                )}
                {s.notes && (
                  <p className="text-xs text-[#6B6A68] line-clamp-2">{s.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[#6B6A68] text-center py-8">Belum ada sponsor terdaftar.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add features/reports/components/tabs/SponsorTab.tsx
rtk git commit -m "feat(reports): SponsorTab with status cards and sponsor grid"
```

---

## Task 8: Refactor ReportView.tsx — tabbed layout + expanded PDF

**Files:**
- Modify: `features/reports/components/ReportView.tsx`

- [ ] **Step 1: Replace ReportView.tsx with tabbed implementation**

```tsx
// features/reports/components/ReportView.tsx
"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OverviewTab } from "@/features/reports/components/tabs/OverviewTab";
import { ScrimTab } from "@/features/reports/components/tabs/ScrimTab";
import { TournamentTab } from "@/features/reports/components/tabs/TournamentTab";
import { FinanceTab } from "@/features/reports/components/tabs/FinanceTab";
import { SponsorTab } from "@/features/reports/components/tabs/SponsorTab";
import type { MonthlyReport } from "@/features/reports/queries";

type TabKey = "overview" | "scrim" | "tournament" | "finance" | "sponsor";

interface ReportViewProps {
  report: MonthlyReport;
}

export function ReportView({ report }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [downloading, setDownloading] = useState(false);

  const isOwner = report.role === "owner";

  const tabs: Array<{ key: TabKey; label: string; ownerOnly?: boolean }> = [
    { key: "overview",    label: "Overview" },
    { key: "scrim",       label: "Scrim" },
    { key: "tournament",  label: "Turnamen" },
    { key: "finance",     label: "Finance",  ownerOnly: true },
    { key: "sponsor",     label: "Sponsor",  ownerOnly: true },
  ].filter((t) => !t.ownerOnly || isOwner);

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      buildFullPdf(doc, report);
      doc.save(`laporan-${report.month.toLowerCase()}-${report.year}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header: title + download */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#E5E2E1]">{report.month} {report.year}</h2>
          <p className="text-xs text-[#6B6A68] mt-0.5">Data ringkasan organisasi untuk periode ini.</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#2D2D2D] bg-[#252525] px-4 text-xs font-medium text-[#E5E2E1] transition-all hover:bg-[#2D2D2D] hover:border-[#3D3D3D] active:scale-95 disabled:opacity-50"
        >
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {downloading ? "Membuat PDF…" : "Download PDF"}
        </button>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b border-[#2D2D2D]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "relative mr-4 cursor-pointer pb-3 px-1 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-yellow-400 after:content-['']"
                : "text-white/40 hover:text-white/70",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview"   && <OverviewTab report={report} />}
        {activeTab === "scrim"      && <ScrimTab report={report} />}
        {activeTab === "tournament" && <TournamentTab report={report} />}
        {activeTab === "finance"    && report.finances && <FinanceTab finances={report.finances} />}
        {activeTab === "sponsor"    && report.sponsors && <SponsorTab sponsors={report.sponsors} />}
      </div>
    </div>
  );
}

// ── PDF Builder ────────────────────────────────────────────────────────────────

type Doc = InstanceType<typeof import("jspdf")["jsPDF"]>;

const PW = 210, PH = 297, M = 20, CW = PW - M * 2;
const C = {
  black:       [18, 18, 18]   as [number,number,number],
  white:       [255,255,255]  as [number,number,number],
  headerBg:    [18, 18, 18]   as [number,number,number],
  gray100:     [249,250,251]  as [number,number,number],
  gray200:     [229,231,235]  as [number,number,number],
  gray400:     [156,163,175]  as [number,number,number],
  gray500:     [107,114,128]  as [number,number,number],
  green:       [22, 163, 74]  as [number,number,number],
  greenLight:  [240,253,244]  as [number,number,number],
  greenBorder: [187,247,208]  as [number,number,number],
  red:         [220, 38, 38]  as [number,number,number],
  redLight:    [254,242,242]  as [number,number,number],
  redBorder:   [254,202,202]  as [number,number,number],
  yellow:      [234,179,  8]  as [number,number,number],
  blue:        [ 37, 99,235]  as [number,number,number],
};

function pdfHelpers(doc: Doc) {
  return {
    fill:  (...rgb: [number,number,number]) => doc.setFillColor(...rgb),
    text:  (...rgb: [number,number,number]) => doc.setTextColor(...rgb),
    draw:  (...rgb: [number,number,number]) => doc.setDrawColor(...rgb),
    font:  (s: "normal"|"bold") => doc.setFont("helvetica", s),
    size:  (n: number) => doc.setFontSize(n),
  };
}

function buildHeader(doc: Doc, r: MonthlyReport) {
  const { fill, text, font, size } = pdfHelpers(doc);
  fill(...C.headerBg); doc.rect(0, 0, PW, 50, "F");
  fill(50,50,50); doc.roundedRect(M, 12, 13, 13, 2, 2, "F");
  size(9); font("bold"); text(...C.white); doc.text("H", M + 4.5, 21);
  size(6.5); font("normal"); text(155,154,151); doc.text("HYPERION TEAM", M + 17, 17);
  size(21); font("bold"); text(...C.white); doc.text(`${r.month} ${r.year}`, M + 17, 30);
  fill(...C.yellow); doc.roundedRect(PW - M - 38, 11, 38, 10, 2.5, 2.5, "F");
  size(6.5); font("bold"); text(...C.black); doc.text("LAPORAN BULANAN", PW - M - 19, 17.5, { align: "center" });
  const genDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  size(7); font("normal"); text(155,154,151); doc.text(genDate, PW - M - 19, 28, { align: "center" });
}

function buildFooter(doc: Doc, r: MonthlyReport, page: number, total: number) {
  const { fill, text, draw, font, size } = pdfHelpers(doc);
  fill(...C.gray100); doc.rect(0, PH - 18, PW, 18, "F");
  draw(...C.gray200); doc.setLineWidth(0.3); doc.line(0, PH - 18, PW, PH - 18);
  size(7); font("normal"); text(...C.gray400);
  doc.text(`Laporan Bulanan · ${r.month} ${r.year} · Hyperion Team`, M, PH - 8);
  doc.text(`Halaman ${page}/${total}`, PW - M, PH - 8, { align: "right" });
}

function sectionTitle(doc: Doc, label: string, labelW: number, y: number) {
  const { text, draw, font, size } = pdfHelpers(doc);
  size(7); font("bold"); text(...C.gray500); doc.text(label, M, y);
  draw(...C.gray200); doc.setLineWidth(0.3); doc.line(M + labelW + 3, y - 1, M + CW, y - 1);
  return y + 7;
}

function statCard(
  doc: Doc, x: number, yPos: number, w: number, h: number,
  label: string, value: string, sub: string,
  valColor: [number,number,number],
  bgColor: [number,number,number] = C.gray100,
  borderColor: [number,number,number] = C.gray200,
) {
  const { fill, text, draw, font, size } = pdfHelpers(doc);
  fill(...bgColor); draw(...borderColor); doc.setLineWidth(0.3);
  doc.roundedRect(x, yPos, w, h, 2.5, 2.5, "FD");
  size(6.5); font("bold"); text(...C.gray500); doc.text(label.toUpperCase(), x + 5, yPos + 7);
  size(15); font("bold"); text(...valColor); doc.text(value, x + 5, yPos + 16);
  size(6.5); font("normal"); text(...C.gray400); doc.text(sub, x + 5, yPos + 22);
}

function buildPage1(doc: Doc, r: MonthlyReport): void {
  buildHeader(doc, r);
  let y = 60;
  const { text, draw, fill, font, size } = pdfHelpers(doc);

  y = sectionTitle(doc, "OVERVIEW", 21, y);
  const cW4 = (CW - 9) / 4; const cardH = 26;
  statCard(doc, M,                  y, cW4, cardH, "Scrim W/L/D", `${r.scrims.wins}W ${r.scrims.losses}L`, `${r.scrims.winRate}% win rate`, r.scrims.winRate >= 50 ? C.green : C.red);
  statCard(doc, M + cW4 + 3,        y, cW4, cardH, "Turnamen",    String(r.tournaments.total), `${r.tournaments.ongoing} berjalan`, C.black);
  statCard(doc, M + (cW4+3)*2,      y, cW4, cardH, "Kehadiran",   `${r.attendance.avgAttendanceRate}%`, "rata-rata", C.blue);
  if (r.finances) {
    const isPos = r.finances.balance >= 0;
    statCard(doc, M + (cW4+3)*3, y, cW4, cardH, "Saldo Kas",
      `Rp ${(Math.abs(r.finances.balance)/1000).toFixed(0)}k`,
      isPos ? "surplus" : "defisit", isPos ? C.green : C.red,
      isPos ? C.greenLight : C.redLight, isPos ? C.greenBorder : C.redBorder,
    );
  } else {
    statCard(doc, M + (cW4+3)*3, y, cW4, cardH, "Member Aktif", String(r.attendance.totalMembers), "anggota", C.black);
  }
  y += cardH + 10;

  // Win rate bar
  size(7.5); font("normal"); text(...C.gray500); doc.text("Win Rate Scrim", M, y + 3.5);
  const barX = M + 35; const barW = CW - 50;
  fill(...C.gray200); doc.setLineWidth(0); doc.roundedRect(barX, y + 0.5, barW, 5, 2.5, 2.5, "F");
  const pct = r.scrims.winRate; const col = pct >= 50 ? C.green : C.red;
  if (pct > 0) { fill(...col); doc.roundedRect(barX, y + 0.5, (pct/100)*barW, 5, 2.5, 2.5, "F"); }
  size(9); font("bold"); text(...col); doc.text(`${pct}%`, M+CW, y+4, { align: "right" });
}

function buildPage2(doc: Doc, r: MonthlyReport): void {
  let y = M + 10;
  const { text, draw, fill, font, size } = pdfHelpers(doc);

  y = sectionTitle(doc, "SCRIM", 14, y);
  const cW4 = (CW - 9) / 4; const cardH = 26;
  statCard(doc, M,             y, cW4, cardH, "Total",  String(r.scrims.total),  "selesai",    C.black);
  statCard(doc, M+cW4+3,       y, cW4, cardH, "Menang", String(r.scrims.wins),   "kemenangan", C.green);
  statCard(doc, M+(cW4+3)*2,   y, cW4, cardH, "Kalah",  String(r.scrims.losses), "kekalahan",  C.red);
  statCard(doc, M+(cW4+3)*3,   y, cW4, cardH, "Seri",   String(r.scrims.draws),  "seri",       C.black);
  y += cardH + 8;

  if (r.scrims.byDivision.length > 1) {
    y = sectionTitle(doc, "PER DIVISI", 25, y);
    for (const d of r.scrims.byDivision) {
      size(8); font("normal"); text(...C.black); doc.text(d.divisionName, M, y);
      size(8); font("bold"); text(d.winRate >= 50 ? C.green : C.red);
      doc.text(`${d.wins}W ${d.losses}L — ${d.winRate}%`, M + CW, y, { align: "right" });
      draw(...C.gray200); doc.setLineWidth(0.2); doc.line(M, y + 2, M + CW, y + 2);
      y += 8;
    }
    y += 4;
  }

  if (r.scrims.list.length > 0) {
    y = sectionTitle(doc, "DAFTAR SCRIM", 30, y);
    for (const s of r.scrims.list.slice(0, 12)) {
      const dateStr = new Date(s.scheduledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      size(7.5); font("normal"); text(...C.black);
      doc.text(`vs ${s.opponentName}`, M, y);
      doc.text(`${s.format.toUpperCase()} · ${dateStr}`, M + CW, y, { align: "right" });
      size(7); text(s.isWin === true ? C.green : s.isWin === false ? C.red : C.gray400 as [number,number,number]);
      doc.text(s.isWin === true ? "Menang" : s.isWin === false ? "Kalah" : "Seri", M + 60, y);
      draw(...C.gray200); doc.setLineWidth(0.1); doc.line(M, y + 2, M + CW, y + 2);
      y += 7;
      if (y > PH - 30) break;
    }
  }
}

function buildPage3(doc: Doc, r: MonthlyReport): void {
  let y = M + 10;
  const { text, draw, fill, font, size } = pdfHelpers(doc);

  y = sectionTitle(doc, "TURNAMEN", 22, y);
  const cW3 = (CW - 6) / 3; const cardH = 26;
  statCard(doc, M,        y, cW3, cardH, "Total",    String(r.tournaments.total),     "turnamen", C.black);
  statCard(doc, M+cW3+3,  y, cW3, cardH, "Berjalan", String(r.tournaments.ongoing),   "aktif",    C.yellow);
  statCard(doc, M+cW3*2+6,y, cW3, cardH, "Selesai",  String(r.tournaments.completed), "selesai",  C.green);
  y += cardH + 10;

  for (const t of r.tournaments.list) {
    size(9); font("bold"); text(...C.black); doc.text(t.name, M, y);
    size(7); font("normal"); text(...C.gray400); doc.text(t.status.toUpperCase(), M + CW, y, { align: "right" });
    y += 6;
    for (const stage of t.stages) {
      size(7.5); font("normal"); text(...C.gray500); doc.text(`  ${stage.stageName}`, M, y);
      const stageResult = stage.wins > 0 || stage.losses > 0
        ? `${stage.wins}W ${stage.losses}L`
        : "Belum dimainkan";
      text(stage.wins > stage.losses ? C.green : stage.losses > 0 ? C.red : C.gray400 as [number,number,number]);
      doc.text(stageResult, M + CW, y, { align: "right" });
      y += 6;
    }
    draw(...C.gray200); doc.setLineWidth(0.2); doc.line(M, y, M + CW, y);
    y += 6;
    if (y > PH - 30) break;
  }

  if (r.tournaments.list.length === 0) {
    size(8); font("normal"); text(...C.gray400); doc.text("Tidak ada turnamen di bulan ini.", M, y);
  }
}

function buildPage4Finance(doc: Doc, finances: NonNullable<MonthlyReport["finances"]>, r: MonthlyReport): void {
  let y = M + 10;
  const { text, draw, fill, font, size } = pdfHelpers(doc);

  y = sectionTitle(doc, "KEUANGAN", 23, y);
  const cW3 = (CW - 6) / 3; const finH = 30;
  const isPos = finances.balance >= 0;
  statCard(doc, M, y, cW3, finH, "Pemasukan", `Rp ${(finances.totalIncome/1000).toFixed(0)}k`, "total masuk", C.green, C.greenLight, C.greenBorder);
  statCard(doc, M+cW3+3, y, cW3, finH, "Pengeluaran", `Rp ${(finances.totalExpense/1000).toFixed(0)}k`, "total keluar", C.red, C.redLight, C.redBorder);
  statCard(doc, M+cW3*2+6, y, cW3, finH, "Saldo", `${isPos ? "" : "-"}Rp ${(Math.abs(finances.balance)/1000).toFixed(0)}k`, isPos ? "surplus" : "defisit", isPos ? C.green : C.red, isPos ? C.greenLight : C.redLight, isPos ? C.greenBorder : C.redBorder);
  y += finH + 10;

  y = sectionTitle(doc, "PEMASUKAN", 24, y);
  for (const f of finances.incomeList.slice(0, 8)) {
    size(7.5); font("normal"); text(...C.black); doc.text(f.description ?? f.category, M, y);
    size(7.5); text(...C.green); doc.text(`+Rp ${f.amount.toLocaleString("id-ID")}`, M+CW, y, { align: "right" });
    draw(...C.gray200); doc.setLineWidth(0.1); doc.line(M, y+2, M+CW, y+2);
    y += 7;
  }
  y += 4;
  y = sectionTitle(doc, "PENGELUARAN", 28, y);
  for (const f of finances.expenseList.slice(0, 8)) {
    size(7.5); font("normal"); text(...C.black); doc.text(f.description ?? f.category, M, y);
    size(7.5); text(...C.red); doc.text(`-Rp ${f.amount.toLocaleString("id-ID")}`, M+CW, y, { align: "right" });
    draw(...C.gray200); doc.setLineWidth(0.1); doc.line(M, y+2, M+CW, y+2);
    y += 7;
    if (y > PH - 30) break;
  }
}

function buildPage5Sponsor(doc: Doc, sponsors: NonNullable<MonthlyReport["sponsors"]>, r: MonthlyReport): void {
  let y = M + 10;
  const { text, draw, fill, font, size } = pdfHelpers(doc);

  y = sectionTitle(doc, "SPONSOR", 19, y);
  const cW3 = (CW - 6) / 3; const cardH = 26;
  statCard(doc, M, y, cW3, cardH, "Total", String(sponsors.total), "sponsor", C.black);
  statCard(doc, M+cW3+3, y, cW3, cardH, "Aktif", String(sponsors.active), "aktif", C.green);
  statCard(doc, M+cW3*2+6, y, cW3, cardH, "Prospek", String(sponsors.prospect), "prospek", C.blue);
  y += cardH + 10;

  if (sponsors.active > 0) {
    size(8); font("normal"); text(...C.gray500); doc.text("Total nilai aktif:", M, y);
    size(13); font("bold"); text(...C.green); doc.text(`Rp ${sponsors.totalActiveValue.toLocaleString("id-ID")}`, M + 40, y);
    y += 12;
  }

  y = sectionTitle(doc, "DAFTAR SPONSOR", 34, y);
  for (const s of sponsors.list) {
    size(8.5); font("bold"); text(...C.black); doc.text(s.name, M, y);
    const statusColor = s.status === "active" ? C.green : s.status === "prospect" ? C.blue : C.gray400 as [number,number,number];
    text(...statusColor); doc.text(s.status.toUpperCase(), M+CW, y, { align: "right" });
    if (s.dealValue != null) {
      size(7); font("normal"); text(...C.gray500);
      doc.text(`${s.currency} ${s.dealValue.toLocaleString("id-ID")}`, M, y + 5);
    }
    draw(...C.gray200); doc.setLineWidth(0.2); doc.line(M, y+8, M+CW, y+8);
    y += 12;
    if (y > PH - 30) break;
  }
}

function buildFullPdf(doc: Doc, r: MonthlyReport) {
  const totalPages = r.role === "owner" ? 5 : 3;
  let page = 1;

  buildPage1(doc, r);
  buildFooter(doc, r, page++, totalPages);

  doc.addPage();
  buildPage2(doc, r);
  buildFooter(doc, r, page++, totalPages);

  doc.addPage();
  buildPage3(doc, r);
  buildFooter(doc, r, page++, totalPages);

  if (r.finances) {
    doc.addPage();
    buildPage4Finance(doc, r.finances, r);
    buildFooter(doc, r, page++, totalPages);
  }

  if (r.sponsors) {
    doc.addPage();
    buildPage5Sponsor(doc, r.sponsors, r);
    buildFooter(doc, r, page++, totalPages);
  }
}
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -40
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
rtk git add features/reports/components/ReportView.tsx
rtk git commit -m "feat(reports): refactor ReportView with tabs and multi-page PDF"
```

---

## Task 9: Update page routes

**Files:**
- Modify: `app/dashboard/(panel)/reports/page.tsx`
- Modify: `app/manage/reports/page.tsx`

- [ ] **Step 1: Update dashboard reports page**

Replace `app/dashboard/(panel)/reports/page.tsx` with:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMonthlyReport } from "@/features/reports/queries";
import { ReportView } from "@/features/reports/components/ReportView";

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default async function DashboardReportsPage({ searchParams }: ReportsPageProps) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!org) {
    return <div className="p-8"><p className="text-sm text-[#9B9A97]">Belum ada organisasi.</p></div>;
  }

  const now = new Date();
  const year  = sp.year  ? parseInt(sp.year)  : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;

  const report = await generateMonthlyReport(org.id, year, month, "owner");

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">Home</Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">Laporan</span>
        </div>
      </header>

      <main className="flex-1 max-w-[960px] w-full mx-auto px-8 py-12 space-y-6">
        <header>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#D4D4D4]" />
            <h1 className="text-xl font-bold text-[#E5E2E1]">Laporan Bulanan</h1>
          </div>
          <p className="text-sm text-[#9B9A97] mt-1">Ringkasan performa tim per bulan.</p>
        </header>

        <nav className="flex flex-wrap gap-1">
          {MONTH_LABELS.map((label, i) => {
            const m = i + 1;
            const active = m === month;
            return (
              <a
                key={m}
                href={`/dashboard/reports?year=${year}&month=${m}`}
                className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
                  active ? "bg-white text-black" : "bg-[#202020] text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#E5E2E1]"
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>

        <ReportView report={report} />
      </main>
    </>
  );
}
```

- [ ] **Step 2: Update manage reports page**

Replace `app/manage/reports/page.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMonthlyReport } from "@/features/reports/queries";
import { ReportView } from "@/features/reports/components/ReportView";

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default async function ManageReportsPage({ searchParams }: ReportsPageProps) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/reports");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/");

  const now = new Date();
  const year  = sp.year  ? parseInt(sp.year)  : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;

  const report = await generateMonthlyReport(membership.organization_id, year, month, "manager");

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-bold text-[#E5E2E1]">Laporan Bulanan</h1>
        </div>
        <p className="text-sm text-[#9B9A97] mt-1">Ringkasan performa tim per bulan.</p>
      </header>

      <nav className="flex flex-wrap gap-1">
        {MONTH_LABELS.map((label, i) => {
          const m = i + 1;
          const active = m === month;
          return (
            <a
              key={m}
              href={`/manage/reports?year=${year}&month=${m}`}
              className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
                active ? "bg-white text-black" : "bg-[#202020] text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#E5E2E1]"
              }`}
            >
              {label}
            </a>
          );
        })}
      </nav>

      <ReportView report={report} />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript — all files**

```bash
npx tsc --noEmit 2>&1 | head -40
```
Expected: no errors

- [ ] **Step 4: Commit and push**

```bash
rtk git add app/dashboard/\(panel\)/reports/page.tsx app/manage/reports/page.tsx
rtk git commit -m "feat(reports): wire up dashboard and manage routes with role-aware reports"
rtk git push
```

---

## Self-Review Notes

**Spec coverage:**
- ✅ Owner `/dashboard/reports` full, Manager `/manage/reports` limited (no Finance/Sponsor)
- ✅ Monthly + 6-month trend charts (WinRateTrendChart, FinanceTrendChart, attendance bar trend)
- ✅ Tournament tab with stage breakdown
- ✅ Per-division scrim breakdown
- ✅ Sponsor tab (owner only)
- ✅ PDF upgraded: 5 pages (owner), 3 pages (manager), footer with page numbers
- ✅ Finance tab hidden from manager

**Type consistency:** `MonthlyReport` defined once in `queries.ts`, imported everywhere. `TrendPoint`, `FinanceTrendPoint` exported and used in chart props.

**Gotchas:**
- `tournament_matches` table not in generated types — uses `as any` cast (same as existing `features/tournaments/queries.ts`)
- Trend attendance query: if no scrims exist in 6-month window, passes `["__none__"]` to avoid empty `.in()` — Supabase returns empty result safely
- PDF page count: `totalPages` calculated upfront based on role (owner=5, manager=3)
- `date-fns` `format` + `id` locale already used in ScrimTab — import from `date-fns/locale` as `idLocale` to avoid name collision with `id` Supabase type
