import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type PlayerContract = Database["public"]["Tables"]["player_contracts"]["Row"];
export type SalaryPayment = Database["public"]["Tables"]["salary_payments"]["Row"];

export interface ContractWithProfile extends PlayerContract {
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  payments: SalaryPayment[];
}

export interface PayrollSummary {
  totalMonthlyPayroll: number;
  activeCount: number;
  expiringCount: number; // contracts ending within 30 days
}

/** Returns all contracts for an org with profile data and last 6 months of payments. */
export async function listContracts(orgId: string): Promise<ContractWithProfile[]> {
  const admin = createAdminClient();

  const { data: contracts } = await admin
    .from("player_contracts")
    .select("*")
    .eq("organization_id", orgId)
    .order("status")
    .order("created_at", { ascending: false });

  if (!contracts || contracts.length === 0) return [];

  const userIds = [...new Set(contracts.map((c) => c.user_id))];
  const contractIds = contracts.map((c) => c.id);

  // 6 months back
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const since = sixMonthsAgo.toISOString().slice(0, 10);

  const [profilesRes, membersRes, paymentsRes] = await Promise.all([
    admin.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
    admin
      .from("team_members")
      .select("user_id, role")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .in("user_id", userIds),
    admin
      .from("salary_payments")
      .select("*")
      .in("contract_id", contractIds)
      .gte("pay_period", since)
      .order("pay_period", { ascending: false }),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const memberMap = new Map((membersRes.data ?? []).map((m) => [m.user_id, m.role]));
  const paymentsByContract = new Map<string, SalaryPayment[]>();
  for (const p of paymentsRes.data ?? []) {
    const list = paymentsByContract.get(p.contract_id) ?? [];
    list.push(p as SalaryPayment);
    paymentsByContract.set(p.contract_id, list);
  }

  return contracts.map((c) => ({
    ...(c as PlayerContract),
    display_name: profileMap.get(c.user_id)?.display_name ?? null,
    avatar_url: profileMap.get(c.user_id)?.avatar_url ?? null,
    role: memberMap.get(c.user_id) ?? null,
    payments: paymentsByContract.get(c.id) ?? [],
  }));
}

export async function getPayrollSummary(orgId: string): Promise<PayrollSummary> {
  const admin = createAdminClient();
  const { data: contracts } = await admin
    .from("player_contracts")
    .select("monthly_salary, status, end_date")
    .eq("organization_id", orgId);

  if (!contracts) return { totalMonthlyPayroll: 0, activeCount: 0, expiringCount: 0 };

  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  let totalMonthlyPayroll = 0;
  let activeCount = 0;
  let expiringCount = 0;

  for (const c of contracts) {
    if (c.status === "active") {
      totalMonthlyPayroll += c.monthly_salary;
      activeCount++;
      if (c.end_date) {
        const end = new Date(c.end_date);
        if (end >= now && end <= in30Days) expiringCount++;
      }
    }
  }

  return { totalMonthlyPayroll, activeCount, expiringCount };
}
