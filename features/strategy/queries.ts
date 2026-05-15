import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type StrategyNote = Database["public"]["Tables"]["strategy_notes"]["Row"];

/**
 * List strategy notes for an org, ordered by updated_at descending.
 */
export async function listStrategyNotes(
  orgId: string,
  divisionId?: string | null,
): Promise<StrategyNote[]> {
  const supabase = await createClient();
  let q = supabase
    .from("strategy_notes")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (divisionId) {
    q = q.eq("division_id", divisionId);
  }

  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

/**
 * Fetch a single strategy note by ID.
 */
export async function getStrategyNote(
  noteId: string,
): Promise<StrategyNote | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("strategy_notes")
    .select("*")
    .eq("id", noteId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
