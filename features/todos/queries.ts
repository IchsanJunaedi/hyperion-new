import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { computeUrgency } from "./logic";
import type { SmartTodo, SmartTodoType } from "./types";

function makeSmartId(type: SmartTodoType, entityId: string): string {
  return `${type}:${entityId}`;
}

async function getContractExpiryTodos(orgId: string, dismissed: Set<string>): Promise<SmartTodo[]> {
  const admin = createAdminClient();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);

  const { data: contracts, error: contractsError } = await admin
    .from("player_contracts")
    .select("id, end_date, user_id")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .not("end_date", "is", null)
    .lte("end_date", in30.toISOString().slice(0, 10))
    .limit(20);
  if (contractsError) console.error("[todos] getContractExpiryTodos:", contractsError.message);

  if (!contracts?.length) return [];

  const userIds = contracts.map((c) => c.user_id);
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);
  if (profilesError) console.error("[todos] getContractExpiryTodos (profiles):", profilesError.message);
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? "player"]));

  return contracts
    .filter((c) => !dismissed.has(makeSmartId("contract_expiry", c.id)))
    .map((c) => ({
      id: makeSmartId("contract_expiry", c.id),
      source: "smart" as const,
      smart_type: "contract_expiry" as const,
      title: `Kontrak ${nameMap.get(c.user_id) ?? "player"} habis ${c.end_date}`,
      urgency: computeUrgency(c.end_date ? new Date(c.end_date) : null),
      entity_id: c.id,
      navigate_to: "/dashboard/salaries",
    }));
}

async function getSalaryDueTodos(orgId: string, dismissed: Set<string>): Promise<SmartTodo[]> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: payments, error: paymentsError } = await admin
    .from("salary_payments")
    .select("id, contract_id, pay_period")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .lte("pay_period", today)
    .limit(50);
  if (paymentsError) console.error("[todos] getSalaryDueTodos:", paymentsError.message);

  if (!payments?.length) return [];

  const contractIds = [...new Set(payments.map((p) => p.contract_id))];
  const { data: contracts, error: contractsError } = await admin
    .from("player_contracts")
    .select("id, user_id")
    .in("id", contractIds);
  if (contractsError) console.error("[todos] getSalaryDueTodos (contracts):", contractsError.message);
  const contractUser = new Map((contracts ?? []).map((c) => [c.id, c.user_id]));

  const userIds = [...new Set([...contractUser.values()])];
  const { data: profiles, error: profilesError } = userIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [], error: null };
  if (profilesError) console.error("[todos] getSalaryDueTodos (profiles):", profilesError.message);
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? "player"]));

  return payments
    .filter((p) => !dismissed.has(makeSmartId("salary_due", p.id)))
    .map((p) => {
      const uid = contractUser.get(p.contract_id);
      return {
        id: makeSmartId("salary_due", p.id),
        source: "smart" as const,
        smart_type: "salary_due" as const,
        title: `Bayar gaji ${nameMap.get(uid ?? "") ?? "player"} — ${p.pay_period}`,
        urgency: computeUrgency(new Date(p.pay_period)),
        entity_id: p.id,
        navigate_to: "/dashboard/salaries",
      };
    });
}

async function getMemberUnassignedTodos(orgId: string, dismissed: Set<string>): Promise<SmartTodo[]> {
  const admin = createAdminClient();

  const { data, error: membersError } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .is("division_id", null)
    .neq("role", "owner")
    .limit(50);
  if (membersError) console.error("[todos] getMemberUnassignedTodos:", membersError.message);

  if (!data?.length) return [];

  const unassigned = data.filter((m) => !dismissed.has(makeSmartId("member_unassigned", m.user_id)));
  if (!unassigned.length) return [];

  const key = `member_unassigned:${orgId}`;
  if (dismissed.has(key)) return [];

  return [{
    id: key,
    source: "smart" as const,
    smart_type: "member_unassigned" as const,
    title: `${unassigned.length} member belum di-assign ke divisi`,
    urgency: "later" as const,
    entity_id: orgId,
    navigate_to: "/dashboard/assign",
  }];
}

async function getTrialPendingTodos(orgId: string, dismissed: Set<string>): Promise<SmartTodo[]> {
  const admin = createAdminClient();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: activeTrials, error: trialsError } = await admin
    .from("open_trials")
    .select("id")
    .eq("org_id", orgId)
    .eq("status", "active")
    .limit(20);
  if (trialsError) console.error("[todos] getTrialPendingTodos:", trialsError.message);

  if (!activeTrials?.length) return [];
  const trialIds = activeTrials.map((t) => t.id);

  const { data: applicants, error: applicantsError } = await admin
    .from("trial_applicants")
    .select("id")
    .in("trial_id", trialIds)
    .eq("status", "pending")
    .lte("created_at", threeDaysAgo.toISOString())
    .limit(100);
  if (applicantsError) console.error("[todos] getTrialPendingTodos (applicants):", applicantsError.message);

  if (!applicants?.length) return [];

  const pending = applicants.filter((a) => !dismissed.has(makeSmartId("trial_pending", a.id)));
  if (!pending.length) return [];

  const key = `trial_pending:${orgId}`;
  if (dismissed.has(key)) return [];

  return [{
    id: key,
    source: "smart" as const,
    smart_type: "trial_pending" as const,
    title: `${pending.length} aplikasi trial menunggu review`,
    urgency: "this_week" as const,
    entity_id: orgId,
    navigate_to: "#trials",
  }];
}

async function getScrimNoResultTodos(orgId: string, dismissed: Set<string>): Promise<SmartTodo[]> {
  const admin = createAdminClient();

  const { data: scrims, error: scrimsError } = await admin
    .from("scrims")
    .select("id, opponent_name, scheduled_at")
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(30);
  if (scrimsError) console.error("[todos] getScrimNoResultTodos:", scrimsError.message);

  if (!scrims?.length) return [];

  const scrimIds = scrims.map((s) => s.id);
  const { data: results, error: resultsError } = await admin
    .from("scrim_results")
    .select("scrim_id")
    .in("scrim_id", scrimIds);
  if (resultsError) console.error("[todos] getScrimNoResultTodos (results):", resultsError.message);

  const hasResult = new Set((results ?? []).map((r) => r.scrim_id));

  return scrims
    .filter((s) => !hasResult.has(s.id) && !dismissed.has(makeSmartId("scrim_no_result", s.id)))
    .map((s) => ({
      id: makeSmartId("scrim_no_result", s.id),
      source: "smart" as const,
      smart_type: "scrim_no_result" as const,
      title: `Input hasil scrim vs ${s.opponent_name}`,
      urgency: computeUrgency(new Date(s.scheduled_at)),
      entity_id: s.id,
      navigate_to: `#scrim-${s.id}`,
    }));
}

async function getSponsorStaleTodos(orgId: string, dismissed: Set<string>): Promise<SmartTodo[]> {
  const admin = createAdminClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error: sponsorsError } = await admin
    .from("sponsors")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("status", "prospect")
    .lte("updated_at", sevenDaysAgo.toISOString())
    .limit(20);
  if (sponsorsError) console.error("[todos] getSponsorStaleTodos:", sponsorsError.message);

  if (!data?.length) return [];

  return data
    .filter((s) => !dismissed.has(makeSmartId("sponsor_stale", s.id)))
    .map((s) => ({
      id: makeSmartId("sponsor_stale", s.id),
      source: "smart" as const,
      smart_type: "sponsor_stale" as const,
      title: `Follow up sponsor ${s.name}`,
      urgency: "this_week" as const,
      entity_id: s.id,
      navigate_to: "/dashboard/sponsors",
    }));
}

async function getTournamentNoBracketTodos(orgId: string, dismissed: Set<string>): Promise<SmartTodo[]> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);

  const { data, error: tournamentsError } = await admin
    .from("tournaments")
    .select("id, name, start_date")
    .eq("organization_id", orgId)
    .gte("start_date", today)
    .lte("start_date", in7.toISOString().slice(0, 10))
    .is("bracket_link", null)
    .is("bracket_file_path", null)
    .limit(20);
  if (tournamentsError) console.error("[todos] getTournamentNoBracketTodos:", tournamentsError.message);

  if (!data?.length) return [];

  return data
    .filter((t) => !dismissed.has(makeSmartId("tournament_no_bracket", t.id)))
    .map((t) => ({
      id: makeSmartId("tournament_no_bracket", t.id),
      source: "smart" as const,
      smart_type: "tournament_no_bracket" as const,
      title: `Setup bracket ${t.name}`,
      urgency: computeUrgency(new Date(t.start_date)),
      entity_id: t.id,
      navigate_to: `/dashboard/tournaments/${t.id}`,
    }));
}

export async function computeSmartTodos(orgId: string, userId: string): Promise<SmartTodo[]> {
  const admin = createAdminClient();

  const { data: dismissals, error: dismissalsError } = await admin
    .from("todo_dismissals")
    .select("smart_type, entity_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .limit(500);
  if (dismissalsError) console.error("[todos] computeSmartTodos:", dismissalsError.message);

  const dismissed = new Set(
    (dismissals ?? []).map((d) => `${d.smart_type}:${d.entity_id}`),
  );

  const results = await Promise.all([
    getContractExpiryTodos(orgId, dismissed),
    getSalaryDueTodos(orgId, dismissed),
    getMemberUnassignedTodos(orgId, dismissed),
    getTrialPendingTodos(orgId, dismissed),
    getScrimNoResultTodos(orgId, dismissed),
    getSponsorStaleTodos(orgId, dismissed),
    getTournamentNoBracketTodos(orgId, dismissed),
  ]);

  return results.flat();
}

export async function getManualTodos(orgId: string, userId: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("manual_todos")
    .select("id, title, due_date, priority, completed_at, created_by, assigned_to")
    .eq("org_id", orgId)
    .eq("created_by", userId)
    .is("assigned_to", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) console.error("[todos] getManualTodos:", error.message);

  return data ?? [];
}

export async function getAssignedToMeTodos(orgId: string, userId: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("manual_todos")
    .select("id, title, due_date, priority, completed_at, created_by, assigned_to")
    .eq("org_id", orgId)
    .eq("assigned_to", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) console.error("[todos] getAssignedToMeTodos:", error.message);

  return data ?? [];
}

export async function getAssignedOutTodos(orgId: string, ownerId: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("manual_todos")
    .select("id, title, due_date, priority, completed_at, assigned_to")
    .eq("org_id", orgId)
    .eq("created_by", ownerId)
    .not("assigned_to", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) console.error("[todos] getAssignedOutTodos:", error.message);

  if (!data?.length) return [];

  const assigneeIds = [...new Set(data.map((t) => t.assigned_to!))];
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", assigneeIds);
  if (profilesError) console.error("[todos] getAssignedOutTodos (profiles):", profilesError.message);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return data.map((t) => ({
    ...t,
    assignee: t.assigned_to ? (profileMap.get(t.assigned_to) ?? null) : null,
  }));
}

export async function getTodoBadgeCount(orgId: string, userId: string): Promise<number> {
  const [smart, manual] = await Promise.all([
    computeSmartTodos(orgId, userId),
    getManualTodos(orgId, userId),
  ]);

  const urgentSmart = smart.filter(
    (t) => t.urgency === "overdue" || t.urgency === "today",
  ).length;

  const urgentManual = manual.filter((r) => {
    if (r.completed_at) return false;
    const u = computeUrgency(r.due_date ? new Date(r.due_date) : null);
    return u === "overdue" || u === "today";
  }).length;

  return urgentSmart + urgentManual;
}
