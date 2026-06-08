import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { computePayrollSpend, type MonthlySpend } from "./logic";

export type PlayerContract = Database["public"]["Tables"]["player_contracts"]["Row"];
export type SalaryPayment = Database["public"]["Tables"]["salary_payments"]["Row"];

export interface BonusDistribution {
  id: string;
  tournamentId: string;
  tournamentName: string;
  placement: number | null;
  bonusAmount: number;
  bonusPercentage: number;
  distributedAt: string;
}

export interface ContractWithProfile extends PlayerContract {
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  payments: SalaryPayment[];
  bonusDistributions: BonusDistribution[];
  division_id?: string | null;
  division_name?: string | null;
  org_name?: string | null;
}

export interface PayrollSummary {
  totalMonthlyPayroll: number;
  activeCount: number;
  expiringCount: number; // contracts ending within 30 days
  paidThisMonth: number; // sum of "paid" salary_payments in the current month
  outstandingThisMonth: number; // totalMonthlyPayroll - paidThisMonth (≥ 0)
  monthlySpend: MonthlySpend[]; // trailing 6 months of paid spend
}

/** Returns all contracts for an org (or multiple orgs) with profile data and last 6 months of payments. */
export async function listContracts(orgIdOrIds: string | string[]): Promise<ContractWithProfile[]> {
  const admin = createAdminClient();
  const orgIds = Array.isArray(orgIdOrIds) ? orgIdOrIds : [orgIdOrIds];

  const { data: contracts } = await admin
    .from("player_contracts")
    .select("id, user_id, organization_id, monthly_salary, bonus_percentage, status, start_date, end_date, notes, created_by, created_at, updated_at")
    .in("organization_id", orgIds)
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

  // Start of current month for bonus distributions
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [profilesRes, membersRes, paymentsRes, bonusRes, divisionsRes, orgsRes] = await Promise.all([
    admin.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
    admin
      .from("team_members")
      .select("user_id, role, division_id, organization_id")
      .in("organization_id", orgIds)
      .eq("is_active", true)
      .in("user_id", userIds),
    admin
      .from("salary_payments")
      .select("id, contract_id, organization_id, pay_period, amount, status, paid_at, paid_by, notes, created_at")
      .in("contract_id", contractIds)
      .gte("pay_period", since)
      .order("pay_period", { ascending: false }),
    admin
      .from("tournament_bonus_distributions")
      .select("id, tournament_id, contract_id, tournament_name, placement, bonus_amount, bonus_percentage, distributed_at")
      .in("contract_id", contractIds)
      .gte("distributed_at", monthStart)
      .order("distributed_at", { ascending: false }),
    admin
      .from("divisions")
      .select("id, name")
      .in("organization_id", orgIds),
    admin
      .from("organizations")
      .select("id, name")
      .in("id", orgIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const memberMap = new Map((membersRes.data ?? []).map((m) => [m.user_id, m.role]));
  const memberDivisions = new Map((membersRes.data ?? []).map((m) => [m.user_id, m.division_id]));
  const divisionMap = new Map((divisionsRes.data ?? []).map((d) => [d.id, d.name]));
  const orgMap = new Map((orgsRes.data ?? []).map((o) => [o.id, o.name]));

  const paymentsByContract = new Map<string, SalaryPayment[]>();
  for (const p of paymentsRes.data ?? []) {
    const list = paymentsByContract.get(p.contract_id) ?? [];
    list.push(p as SalaryPayment);
    paymentsByContract.set(p.contract_id, list);
  }
  const bonusByContract = new Map<string, BonusDistribution[]>();
  for (const b of bonusRes.data ?? []) {
    const list = bonusByContract.get(b.contract_id) ?? [];
    list.push({
      id: b.id,
      tournamentId: b.tournament_id,
      tournamentName: b.tournament_name,
      placement: b.placement,
      bonusAmount: Number(b.bonus_amount),
      bonusPercentage: Number(b.bonus_percentage),
      distributedAt: b.distributed_at,
    });
    bonusByContract.set(b.contract_id, list);
  }

  return contracts
    .filter((c) => memberMap.has(c.user_id))
    .map((c) => {
      const divisionId = memberDivisions.get(c.user_id) ?? null;
      return {
        ...(c as PlayerContract),
        display_name: profileMap.get(c.user_id)?.display_name ?? null,
        avatar_url: profileMap.get(c.user_id)?.avatar_url ?? null,
        role: memberMap.get(c.user_id) ?? null,
        division_id: divisionId,
        division_name: divisionId ? (divisionMap.get(divisionId) ?? null) : null,
        org_name: orgMap.get(c.organization_id) ?? null,
        payments: paymentsByContract.get(c.id) ?? [],
        bonusDistributions: bonusByContract.get(c.id) ?? [],
      };
    });
}

export async function getPayrollSummary(orgIdOrIds: string | string[]): Promise<PayrollSummary> {
  const admin = createAdminClient();
  const orgIds = Array.isArray(orgIdOrIds) ? orgIdOrIds : [orgIdOrIds];

  // 6 months back (first of that month) for the spend chart.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const since = sixMonthsAgo.toISOString().slice(0, 10);

  const [contractsRes, paymentsRes, activeMembersRes] = await Promise.all([
    admin
      .from("player_contracts")
      .select("user_id, monthly_salary, status, end_date")
      .in("organization_id", orgIds),
    admin
      .from("salary_payments")
      .select("pay_period, amount, status")
      .in("organization_id", orgIds)
      .gte("pay_period", since)
      .limit(1000),
    admin
      .from("team_members")
      .select("user_id")
      .in("organization_id", orgIds)
      .eq("is_active", true)
      .limit(100),
  ]);

  const activeMemberIds = new Set((activeMembersRes.data ?? []).map((m) => m.user_id));
  const contracts = (contractsRes.data ?? []).filter((c) => activeMemberIds.has(c.user_id));
  const { paidThisMonth, monthlySpend } = computePayrollSpend(paymentsRes.data ?? []);

  if (!contracts.length) {
    return {
      totalMonthlyPayroll: 0,
      activeCount: 0,
      expiringCount: 0,
      paidThisMonth,
      outstandingThisMonth: 0,
      monthlySpend,
    };
  }

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

  return {
    totalMonthlyPayroll,
    activeCount,
    expiringCount,
    paidThisMonth,
    outstandingThisMonth: Math.max(0, totalMonthlyPayroll - paidThisMonth),
    monthlySpend,
  };
}
