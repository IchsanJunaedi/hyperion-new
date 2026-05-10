-- =============================================================================
-- 20260510000007_notification_helpers.sql
--
-- Restricted UPDATE path for the notifications table.
--
-- We deliberately do NOT expose a generic UPDATE policy on notifications
-- to the `authenticated` role (see 20260510000003_rls_policies.sql →
-- "notifications"). Without that restriction a malicious user could
-- update their own row to set status='pending', attempts=0, and a
-- crafted wa_number / wa_message — the service-role process-wa-queue
-- Edge Function would then dutifully deliver that attacker-controlled
-- WhatsApp via Fonnte.
--
-- Instead, the only legitimate user-side operation (marking a
-- notification as read) goes through these SECURITY DEFINER functions,
-- which can only mutate `read_at` and `status` (to 'read') and only
-- on rows the caller actually owns.
--
-- IMPORTANT: `status` is shared with the WA delivery state machine
-- (pending → sent / failed). The WA queue Edge Function picks up rows
-- by `status = 'pending'`, so naively flipping status to 'read' on a
-- pending row would silently cancel the WhatsApp delivery. The helpers
-- below therefore only transition status to 'read' when the row is
-- already past the delivery stage:
--
--   * `status = 'sent'`  → safe to mark read; WA already delivered.
--   * `wa_number IS NULL` → in-app-only notification, no delivery to
--                            cancel; safe to mark read.
--   * `status IN ('pending','failed')` with `wa_number` set → only
--     `read_at` is stamped; status stays so the queue / retry logic
--     keeps owning the row.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated public.notifications;
BEGIN
  UPDATE public.notifications
     SET read_at = COALESCE(read_at, now()),
         status  = CASE
                     WHEN status = 'sent' OR wa_number IS NULL THEN 'read'::notification_status
                     ELSE status
                   END
   WHERE id      = notification_id
     AND user_id = auth.uid()
   RETURNING * INTO updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'notification % not found or not owned by current user', notification_id
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  RETURN updated;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

-- Convenience: mark every unread notification for the current user as read.
-- Same status-guard as the single-row variant — pending / failed rows that
-- still have a `wa_number` get a `read_at` stamp but keep their delivery
-- status so the WA queue can finish its job.
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  WITH upd AS (
    UPDATE public.notifications
       SET read_at = now(),
           status  = CASE
                       WHEN status = 'sent' OR wa_number IS NULL THEN 'read'::notification_status
                       ELSE status
                     END
     WHERE user_id = auth.uid()
       AND read_at IS NULL
    RETURNING 1
  )
  SELECT count(*) INTO affected FROM upd;
  RETURN affected;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM anon;
GRANT  EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
