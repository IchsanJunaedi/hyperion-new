import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FinanceRow } from "@/types/database";

export type { FinanceRow };

export interface FinanceSummary {
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
  const end = new Date(year, month, 0).toISOString().slice(0, 10);

  const { data } = await admin
    .from("finances")
    .select("*")
    .eq("organization_id", orgId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  return data ?? [];
}

export function summarizeFinances(rows: FinanceRow[]): FinanceSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const r of rows) {
    if (r.type === "income") totalIncome += r.amount;
    else totalExpense += r.amount;
  }
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}
