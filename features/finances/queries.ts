import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FinanceRow } from "@/types/database";

export type { FinanceRow };

export interface FinanceSummary {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export async function listFinances(
  orgId: string,
  year: number,
  month: number,
): Promise<FinanceRow[]> {
  const admin = createAdminClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data } = await admin
    .from("finances")
    .select("*")
    .eq("organization_id", orgId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  return data ?? [];
}

export async function getFinanceSummary(
  orgId: string,
  year: number,
  month: number,
  currentRows: FinanceRow[]
): Promise<FinanceSummary> {
  const admin = createAdminClient();
  const startOfCurrentMonth = `${year}-${String(month).padStart(2, "0")}-01`;

  // 1. Calculate opening balance (all transactions before this month)
  const { data: previousData } = await admin
    .from("finances")
    .select("type, amount")
    .eq("organization_id", orgId)
    .lt("date", startOfCurrentMonth);

  let openingBalance = 0;
  for (const r of previousData ?? []) {
    if (r.type === "income") openingBalance += r.amount;
    else openingBalance -= r.amount;
  }

  // 2. Calculate current month totals
  let totalIncome = 0;
  let totalExpense = 0;
  for (const r of currentRows) {
    if (r.type === "income") totalIncome += r.amount;
    else totalExpense += r.amount;
  }

  return {
    openingBalance,
    totalIncome,
    totalExpense,
    balance: openingBalance + totalIncome - totalExpense,
  };
}
