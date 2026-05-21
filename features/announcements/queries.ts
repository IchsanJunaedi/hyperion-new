import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

export type AnnouncementListFilter = "all" | "pinned";

/**
 * List announcements for an org, optionally filtered to pinned only.
 * Ordered by created_at descending (newest first).
 */
export async function listAnnouncements(
  orgId: string,
  filter: AnnouncementListFilter = "all",
  limit = 50,
): Promise<Announcement[]> {
  const supabase = await createClient();
  let q = supabase
    .from("announcements")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter === "pinned") {
    q = q.eq("is_pinned", true);
  }

  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

/**
 * Fetch a single announcement by ID.
 */
export async function getAnnouncement(
  announcementId: string,
): Promise<Announcement | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", announcementId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/**
 * Mark an announcement as read for the current user.
 * Idempotent — safe to call every time the page renders.
 */
export async function markAnnouncementRead(announcementId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("announcement_reads")
    .upsert(
      { announcement_id: announcementId, user_id: user.id },
      { onConflict: "announcement_id,user_id", ignoreDuplicates: true },
    );
}

/**
 * Get the read count for an announcement (for managers).
 */
export async function getAnnouncementReadCount(announcementId: string): Promise<number> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from("announcement_reads")
    .select("*", { count: "exact", head: true })
    .eq("announcement_id", announcementId);
  return count ?? 0;
}

/**
 * Batch-fetch read counts for a list of announcement IDs.
 * Returns a Map<announcement_id, count>.
 */
export async function getAnnouncementReadCountsBatch(
  announcementIds: string[],
): Promise<Map<string, number>> {
  if (announcementIds.length === 0) return new Map();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("announcement_reads")
    .select("announcement_id")
    .in("announcement_id", announcementIds);

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ announcement_id: string }>) {
    counts.set(row.announcement_id, (counts.get(row.announcement_id) ?? 0) + 1);
  }
  return counts;
}
