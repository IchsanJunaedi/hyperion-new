import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentCalendarRow, ContentStatus } from "@/types/database";

export type { ContentCalendarRow };

export async function listContent(
  orgId: string,
  status?: ContentStatus | "all",
): Promise<(ContentCalendarRow & { creator_name: string | null })[]> {
  const admin = createAdminClient();
  let q = admin
    .from("content_calendar")
    .select(
      "id, organization_id, title, description, platform, status, scheduled_at, approved_at, approved_by, created_by, created_at",
    )
    .eq("organization_id", orgId)
    .order("scheduled_at", { ascending: true });

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  const { data: rows } = await q;
  if (!rows || rows.length === 0) return [];

  const creatorIds = [...new Set(rows.map((r) => r.created_by))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, username")
    .in("id", creatorIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name ?? p.username ?? null]),
  );

  return rows.map((r) => ({ ...r, creator_name: profileMap.get(r.created_by) ?? null }));
}

export async function listPendingApproval(
  orgId: string,
): Promise<ContentCalendarRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("content_calendar")
    .select(
      "id, organization_id, title, description, platform, status, scheduled_at, approved_at, approved_by, created_by, created_at",
    )
    .eq("organization_id", orgId)
    .eq("status", "scheduled")
    .order("created_at", { ascending: true });
  return data ?? [];
}
