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
