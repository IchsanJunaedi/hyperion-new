import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MonthlyReport {
  month: string;
  year: number;
  scrims: {
    total: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
  attendance: {
    totalMembers: number;
    avgAttendanceRate: number;
  };
  finances: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

/**
 * Generate monthly report data for an org.
 */
export async function generateMonthlyReport(
  orgId: string,
  year: number,
  month: number,
): Promise<MonthlyReport> {
  const admin = createAdminClient();

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  // Scrims
  const { data: scrims } = await admin
    .from("scrims")
    .select("id, status")
    .eq("organization_id", orgId)
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate);

  const completedScrimIds = (scrims ?? [])
    .filter((s) => s.status === "completed")
    .map((s) => s.id);

  let wins = 0, losses = 0, draws = 0;
  if (completedScrimIds.length > 0) {
    const { data: results } = await admin
      .from("scrim_results")
      .select("is_win")
      .in("scrim_id", completedScrimIds);

    for (const r of results ?? []) {
      if (r.is_win === true) wins++;
      else if (r.is_win === false) losses++;
      else draws++;
    }
  }

  const totalScrims = completedScrimIds.length;
  const winRate = totalScrims > 0 ? Math.round((wins / totalScrims) * 100) : 0;

  // Attendance
  const { data: attendances } = await admin
    .from("scrim_attendances")
    .select("status")
    .in("scrim_id", (scrims ?? []).map((s) => s.id));

  const totalAttendanceRecords = (attendances ?? []).length;
  const confirmedCount = (attendances ?? []).filter((a) => a.status === "confirmed").length;
  const avgAttendanceRate = totalAttendanceRecords > 0
    ? Math.round((confirmedCount / totalAttendanceRecords) * 100)
    : 0;

  const { count: memberCount } = await admin
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("is_active", true);

  // Finances
  const { data: finances } = await admin
    .from("finances")
    .select("type, amount")
    .eq("organization_id", orgId)
    .gte("date", `${year}-${String(month).padStart(2, "0")}-01`)
    .lte("date", `${year}-${String(month).padStart(2, "0")}-31`);

  let totalIncome = 0, totalExpense = 0;
  for (const f of finances ?? []) {
    if (f.type === "income") totalIncome += f.amount;
    else totalExpense += f.amount;
  }

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  return {
    month: monthNames[month - 1],
    year,
    scrims: { total: totalScrims, wins, losses, draws, winRate },
    attendance: {
      totalMembers: memberCount ?? 0,
      avgAttendanceRate,
    },
    finances: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    },
  };
}
