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
  const { error } = await (supabase as any)
    .from("announcement_reads")
    .upsert(
      { announcement_id: announcementId, user_id: user.id },
      { onConflict: "announcement_id,user_id", ignoreDuplicates: true },
    );
  if (error) console.error("[markAnnouncementRead]", error);
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
 * Check if the current user has acknowledged a specific announcement.
 */
export async function hasCurrentUserAcknowledged(announcementId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("announcement_reads")
    .select("announcement_id")
    .eq("announcement_id", announcementId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

/**
 * Get details of who has acknowledged a requires_ack announcement.
 * Returns { acknowledged: string[], pending: string[] } of display names.
 */
export async function getAcknowledgementDetails(
  announcementId: string,
  organizationId: string,
): Promise<{ acknowledgedCount: number; pendingCount: number; pendingNames: string[] }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reads } = await (supabase as any)
    .from("announcement_reads")
    .select("user_id")
    .eq("announcement_id", announcementId);
  const readUserIds = new Set<string>((reads ?? []).map((r: { user_id: string }) => r.user_id));

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, profiles(display_name, username)")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  const allMembers = (members ?? []) as unknown as Array<{
    user_id: string;
    profiles: { display_name: string | null; username: string | null } | null;
  }>;

  const pendingNames: string[] = [];
  let acknowledgedCount = 0;

  for (const m of allMembers) {
    if (readUserIds.has(m.user_id)) {
      acknowledgedCount++;
    } else {
      const name = m.profiles?.display_name ?? m.profiles?.username ?? "Unknown";
      pendingNames.push(name);
    }
  }

  return { acknowledgedCount, pendingCount: pendingNames.length, pendingNames };
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
  const { data, error } = await (supabase as any)
    .from("announcement_reads")
    .select("announcement_id")
    .in("announcement_id", announcementIds);
  if (error) console.error("[getAnnouncementReadCountsBatch]", error);

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ announcement_id: string }>) {
    counts.set(row.announcement_id, (counts.get(row.announcement_id) ?? 0) + 1);
  }
  return counts;
}
