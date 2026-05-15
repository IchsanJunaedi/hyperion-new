import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type OpponentProfile = Database["public"]["Tables"]["opponent_profiles"]["Row"];

/**
 * List all opponent profiles for an org.
 */
export async function listOpponentProfiles(orgId: string): Promise<OpponentProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opponent_profiles")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

/**
 * Find opponent profile by name (case-insensitive match).
 * Used to auto-show scouting info in scrim detail.
 */
export async function findOpponentByName(
  orgId: string,
  opponentName: string,
): Promise<OpponentProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opponent_profiles")
    .select("*")
    .eq("organization_id", orgId)
    .ilike("opponent_name", opponentName)
    .maybeSingle();
  return data ?? null;
}

/**
 * Get a single opponent profile by ID.
 */
export async function getOpponentProfile(profileId: string): Promise<OpponentProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opponent_profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  return data ?? null;
}
