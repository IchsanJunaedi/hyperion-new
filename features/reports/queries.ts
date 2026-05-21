import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrendPoint {
  monthLabel: string;
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

  finances: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    incomeList: Array<{ description: string | null; category: string; date: string; amount: number }>;
    expenseList: Array<{ description: string | null; category: string; date: string; amount: number }>;
  } | null;

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
    scrimWinRate: TrendPoint[];
    finance: FinanceTrendPoint[] | null;
    attendance: AttendanceTrendPoint[];
  };

  activity: {
    scrimsScheduled: number;
    tournamentsActive: number;
    sponsorsActive: number | null;
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
  const monthPad = String(month).padStart(2, "0");

  // ── 1. Scrims for this month ───────────────────────────────────────────────
  const { data: scrims } = await admin
    .from("scrims")
    .select("id, status, opponent_name, format, division_id, scheduled_at")
    .eq("organization_id", orgId)
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate);

  const completedScrims = (scrims ?? []).filter((s) => s.status === "completed");
  const completedIds = completedScrims.map((s) => s.id);
  const allScrimIds = (scrims ?? []).map((s) => s.id);

  // ── 2. Scrim results ──────────────────────────────────────────────────────
  const resultMap = new Map<string, boolean | null>();
  if (completedIds.length > 0) {
    const { data: results } = await admin
      .from("scrim_results")
      .select("scrim_id, is_win")
      .in("scrim_id", completedIds);
    for (const r of results ?? []) resultMap.set(r.scrim_id, r.is_win);
  }

  // ── 3. Divisions ──────────────────────────────────────────────────────────
  const divisionIds = [...new Set((scrims ?? []).map((s) => s.division_id).filter(Boolean))] as string[];
  const divisionNameMap = new Map<string, string>();
  if (divisionIds.length > 0) {
    const { data: divs } = await admin
      .from("divisions")
      .select("id, name")
      .in("id", divisionIds);
    for (const d of divs ?? []) divisionNameMap.set(d.id, d.name);
  }

  // ── 4. Scrim aggregation ──────────────────────────────────────────────────
  let wins = 0, losses = 0, draws = 0;
  const divMap = new Map<string, {
    divisionId: string | null; divisionName: string;
    total: number; wins: number; losses: number; draws: number;
  }>();

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
    .map((d) => ({ ...d, winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0 }));

  const scrimList = completedScrims
    .map((s) => ({
      id: s.id,
      scheduledAt: s.scheduled_at,
      opponentName: s.opponent_name,
      format: s.format,
      divisionName: s.division_id ? (divisionNameMap.get(s.division_id) ?? null) : null,
      isWin: resultMap.get(s.id) ?? null,
    }))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  // ── 5. Attendance ─────────────────────────────────────────────────────────
  let avgAttendanceRate = 0;
  if (allScrimIds.length > 0) {
    const { data: attendances } = await admin
      .from("scrim_attendances")
      .select("status")
      .in("scrim_id", allScrimIds);
    const attTotal = (attendances ?? []).length;
    const confirmed = (attendances ?? []).filter((a) => a.status === "confirmed").length;
    avgAttendanceRate = attTotal > 0 ? Math.round((confirmed / attTotal) * 100) : 0;
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
    .gte("start_date", `${year}-${monthPad}-01`)
    .lte("start_date", `${year}-${monthPad}-31`);

  const tournamentDivIds = [...new Set((tournamentsRaw ?? []).map((t) => t.division_id).filter(Boolean))] as string[];
  const tournamentDivMap = new Map<string, string>();
  if (tournamentDivIds.length > 0) {
    const { data: tDivs } = await admin.from("divisions").select("id, name").in("id", tournamentDivIds);
    for (const d of tDivs ?? []) tournamentDivMap.set(d.id, d.name);
  }

  const tournamentIds = (tournamentsRaw ?? []).map((t) => t.id);
  const stagesByTournament = new Map<string, Array<{ id: string; stage_name: string; is_completed: boolean }>>();
  const matchesByStage = new Map<string, Array<{ is_win: boolean | null }>>();

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
      // tournament_matches not in generated types — use any cast (same as features/tournaments/queries.ts)
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
      .gte("date", `${year}-${monthPad}-01`)
      .lte("date", `${year}-${monthPad}-31`)
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

    const activeSp = (sponsorData ?? []).filter((s) => s.status === "active");
    sponsors = {
      total: (sponsorData ?? []).length,
      active: activeSp.length,
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
      totalActiveValue: activeSp.reduce((sum, s) => sum + (s.deal_value ?? 0), 0),
    };
  }

  // ── 9. Trend (last 6 months) — fetch sequentially to avoid race condition ──
  const trendMonths = last6Months(year, month);
  // last6Months always returns exactly 6 elements
  const firstTrendMonth = trendMonths[0] as { year: number; month: number };
  const trendStart = new Date(firstTrendMonth.year, firstTrendMonth.month - 1, 1).toISOString();
  const trendEnd = new Date(year, month, 0, 23, 59, 59).toISOString();

  // Step 1: fetch scrims for the 6-month window
  const { data: trendScrims } = await admin
    .from("scrims")
    .select("id, scheduled_at, status")
    .eq("organization_id", orgId)
    .gte("scheduled_at", trendStart)
    .lte("scheduled_at", trendEnd);

  const trendScrimIds = (trendScrims ?? []).map((s) => s.id);

  // Step 2: fetch scrim results + attendance + finances in parallel (we now have the IDs)
  const trendFinStart = `${firstTrendMonth.year}-${String(firstTrendMonth.month).padStart(2, "0")}-01`;
  const trendFinEnd = `${year}-${monthPad}-31`;

  const [trendResultsRes, trendAttRes, trendFinRes] = await Promise.all([
    trendScrimIds.length > 0
      ? admin.from("scrim_results").select("scrim_id, is_win").in("scrim_id", trendScrimIds.filter((id) => {
          // only completed scrims
          const s = (trendScrims ?? []).find((x) => x.id === id);
          return s?.status === "completed";
        }))
      : Promise.resolve({ data: [] as Array<{ scrim_id: string; is_win: boolean | null }> }),
    trendScrimIds.length > 0
      ? admin.from("scrim_attendances").select("scrim_id, status").in("scrim_id", trendScrimIds)
      : Promise.resolve({ data: [] as Array<{ scrim_id: string; status: string }> }),
    role === "owner"
      ? admin.from("finances").select("type, amount, date")
          .eq("organization_id", orgId)
          .gte("date", trendFinStart)
          .lte("date", trendFinEnd)
      : Promise.resolve({ data: [] as Array<{ type: string; amount: number; date: string }> }),
  ]);

  const trendResultMap = new Map<string, boolean | null>();
  for (const r of trendResultsRes.data ?? []) trendResultMap.set(r.scrim_id, r.is_win);

  const completedTrendScrims = (trendScrims ?? []).filter((s) => s.status === "completed");

  const scrimWinRate: TrendPoint[] = trendMonths.map(({ year: y, month: m }) => {
    const monthScrims = completedTrendScrims.filter((s) => {
      const d = new Date(s.scheduled_at);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
    const mWins = monthScrims.filter((s) => trendResultMap.get(s.id) === true).length;
    return {
      monthLabel: monthLabel(y, m),
      winRate: monthScrims.length > 0 ? Math.round((mWins / monthScrims.length) * 100) : 0,
      total: monthScrims.length,
    };
  });

  const financeTrend: FinanceTrendPoint[] | null = role === "owner"
    ? trendMonths.map(({ year: y, month: m }) => {
        const prefix = `${y}-${String(m).padStart(2, "0")}`;
        const monthFin = (trendFinRes.data ?? []) as Array<{ type: string; amount: number; date: string }>;
        const income = monthFin.filter((f) => f.date.startsWith(prefix) && f.type === "income").reduce((s, f) => s + f.amount, 0);
        const expense = monthFin.filter((f) => f.date.startsWith(prefix) && f.type === "expense").reduce((s, f) => s + f.amount, 0);
        return { monthLabel: monthLabel(y, m), income, expense };
      })
    : null;

  const attendanceTrend: AttendanceTrendPoint[] = trendMonths.map(({ year: y, month: m }) => {
    const monthScrimIds = (trendScrims ?? [])
      .filter((s) => { const d = new Date(s.scheduled_at); return d.getFullYear() === y && d.getMonth() + 1 === m; })
      .map((s) => s.id);
    const monthAtt = (trendAttRes.data ?? []).filter((a) => monthScrimIds.includes(a.scrim_id));
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
