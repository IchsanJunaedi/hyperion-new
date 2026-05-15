import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetch the most recent notifications for the authenticated user.
 * RLS ensures only the user's own notifications are returned.
 */
export async function getNotifications(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/**
 * Return the count of unread notifications for the authenticated user.
 * Uses head:true so no row data is transferred — only the count header.
 */
export async function getUnreadCount() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

/**
 * Fetch paginated WA delivery notifications for the captain+ dashboard.
 * Joins profiles for member display_name. Authorization (captain+ check)
 * is expected to be done at the page level before calling this function.
 */
export async function getWaDeliveryList(
  orgId: string,
  filter: "all" | "pending" | "sent" | "failed" = "all",
  page = 0,
  pageSize = 20,
) {
  const supabase = await createClient();

  let q = supabase
    .from("notifications")
    .select("*, profiles!inner(display_name)", { count: "exact" })
    .eq("organization_id", orgId)
    .not("wa_number", "is", null)
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (filter !== "all") {
    q = q.eq("status", filter);
  }

  const { data, count, error } = await q;
  if (error) return { data: [], total: 0 };
  return { data: data ?? [], total: count ?? 0 };
}
