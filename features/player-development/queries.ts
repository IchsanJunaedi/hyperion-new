import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PlayerTarget = Database["public"]["Tables"]["player_targets"]["Row"];
export type PlayerTargetHistory = Database["public"]["Tables"]["player_target_history"]["Row"];

export interface PlayerTargetWithHistory extends PlayerTarget {
  history: PlayerTargetHistory[];
  player_name: string | null;
}

/**
 * List all player targets for an org, grouped by player.
 */
export async function listPlayerTargets(orgId: string): Promise<PlayerTargetWithHistory[]> {
  const supabase = await createClient();
  const { data: targets } = await supabase
    .from("player_targets")
    .select("*")
    .eq("organization_id", orgId)
    .order("user_id")
    .order("skill_name");

  if (!targets || targets.length === 0) return [];

  // Get history for all targets
  const targetIds = targets.map((t) => t.id);
  const { data: history } = await supabase
    .from("player_target_history")
    .select("*")
    .in("target_id", targetIds)
    .order("recorded_at", { ascending: true })
    .limit(30);

  // Get player names
  const userIds = [...new Set(targets.map((t) => t.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const historyMap = new Map<string, PlayerTargetHistory[]>();
  for (const h of history ?? []) {
    const arr = historyMap.get(h.target_id) ?? [];
    arr.push(h);
    historyMap.set(h.target_id, arr);
  }

  return targets.map((t) => ({
    ...t,
    history: historyMap.get(t.id) ?? [],
    player_name: profileMap.get(t.user_id) ?? null,
  }));
}

/**
 * Get targets for a specific player.
 */
export async function getPlayerTargets(
  orgId: string,
  userId: string,
): Promise<PlayerTargetWithHistory[]> {
  const supabase = await createClient();
  const { data: targets } = await supabase
    .from("player_targets")
    .select("*")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .order("skill_name");

  if (!targets || targets.length === 0) return [];

  const targetIds = targets.map((t) => t.id);
  const { data: history } = await supabase
    .from("player_target_history")
    .select("*")
    .in("target_id", targetIds)
    .order("recorded_at", { ascending: true })
    .limit(30);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const historyMap = new Map<string, PlayerTargetHistory[]>();
  for (const h of history ?? []) {
    const arr = historyMap.get(h.target_id) ?? [];
    arr.push(h);
    historyMap.set(h.target_id, arr);
  }

  return targets.map((t) => ({
    ...t,
    history: historyMap.get(t.id) ?? [],
    player_name: profile?.display_name ?? null,
  }));
}
