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
    .select("id, title, content, created_at, created_by, division_id, is_pinned, organization_id, tags, updated_at, visibility")
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
    .select("id, title, content, created_at, created_by, division_id, is_pinned, organization_id, tags, updated_at, visibility")
    .eq("id", noteId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export interface StrategyCommentWithProfile {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name: string | null;
}

/**
 * Fetch comments for a strategy note with author display names.
 */
export async function listStrategyComments(
  noteId: string,
): Promise<StrategyCommentWithProfile[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: comments } = await (supabase as any)
    .from("strategy_comments")
    .select("id, note_id, user_id, content, created_at")
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (!comments || comments.length === 0) return [];

  const userIds = [...new Set(comments.map((c: { user_id: string }) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds as string[]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return comments.map((c: { id: string; note_id: string; user_id: string; content: string; created_at: string }) => ({
    ...c,
    display_name: profileMap.get(c.user_id) ?? null,
  }));
}
