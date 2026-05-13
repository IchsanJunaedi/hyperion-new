"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ActionError {
  ok: false;
  message: string;
}

/**
 * Mark a single notification as read by calling the `mark_notification_read`
 * SECURITY DEFINER function. The function enforces ownership (user_id = auth.uid())
 * and preserves the delivery `status` field for WA pipeline rows.
 */
export async function markNotificationRead(
  notificationId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Mark all notifications as read for the authenticated user by calling
 * the `mark_all_notifications_read` SECURITY DEFINER function.
 */
export async function markAllNotificationsRead(): Promise<
  ActionError | { ok: true }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase.rpc("mark_all_notifications_read");
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Retry a failed WhatsApp delivery. Captain+ only.
 *
 * Resets the notification status to 'pending' and clears `claimed_at` so
 * the pg_cron Edge Function picks it up again on the next sweep.
 * Maximum 3 retries per notification.
 */
export async function retryFailedWa(
  notificationId: string,
  orgId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Server-side captain+ authorization check
  const { data: isCaptain } = await supabase.rpc("is_captain_or_above", {
    org_id: orgId,
  });
  if (!isCaptain) return { ok: false, message: "Akses ditolak" };

  // Use admin client to bypass RLS for cross-user notification updates
  const admin = createAdminClient();

  // Fetch the notification and validate it belongs to the org and is failed
  const { data: notif } = await admin
    .from("notifications")
    .select("retry_count, status, organization_id")
    .eq("id", notificationId)
    .eq("organization_id", orgId)
    .single();

  if (!notif) return { ok: false, message: "Notifikasi tidak ditemukan" };
  if (notif.status !== "failed")
    return { ok: false, message: "Hanya notifikasi gagal yang bisa di-retry" };
  if ((notif.retry_count ?? 0) >= 3)
    return { ok: false, message: "Batas retry tercapai (maks 3x)" };

  // Reset to pending so pg_cron picks it up again
  const { error } = await admin
    .from("notifications")
    .update({
      status: "pending",
      claimed_at: null,
      retry_count: (notif.retry_count ?? 0) + 1,
    })
    .eq("id", notificationId);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
