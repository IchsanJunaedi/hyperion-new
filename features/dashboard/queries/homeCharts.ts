import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const firstKey = monthKeys[0] ?? "";
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

  const scrims = (scrimsRes.data ?? []) as unknown as ScrimRow[];
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

  const months: MonthPoint[] = monthKeys.map((k, i) => {
    const scrim = scrimSeries[i]!;
    const finance = financeSeries[i]!;
    return {
      monthKey: k,
      monthLabel: monthLabelOf(k),
      winRate: scrim.winRate,
      scrimCount: scrim.scrimCount,
      attendanceRate: attendanceSeries[i] ?? 0,
      income: finance.income,
      expense: finance.expense,
      cumulativeBalance: finance.cumulativeBalance,
    };
  });

  const sponsors: SponsorSlice[] = (sponsorsRes.data ?? [])
    .filter((s) => (s.deal_value ?? 0) > 0)
    .map((s) => ({ name: s.name, value: s.deal_value ?? 0 }));

  return { months, sponsors };
}
