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
    .select("id, type, amount, description, date, category, created_at")
    .eq("organization_id", orgId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  return (data ?? []) as unknown as FinanceRow[];
}

export async function getFinanceSummary(
  orgId: string,
  year: number,
  month: number,
  currentRows: FinanceRow[]
): Promise<FinanceSummary> {
  const admin = createAdminClient();
  const startOfCurrentMonth = `${year}-${String(month).padStart(2, "0")}-01`;

  // Single SQL SUM instead of fetching all historical rows and summing in JS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: openingBalanceRaw } = await (admin as any).rpc("get_opening_balance", {
    p_org_id: orgId,
    p_before_date: startOfCurrentMonth,
  }) as { data: number | null };

  const openingBalance = Number(openingBalanceRaw ?? 0);

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
