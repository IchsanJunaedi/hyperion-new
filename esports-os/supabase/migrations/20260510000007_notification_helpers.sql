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
-- notification as read) goes through this SECURITY DEFINER function,
-- which can only mutate `read_at` and `status` (to 'read') and only
-- on rows the caller actually owns.
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
     SET status  = 'read',
         read_at = COALESCE(read_at, now())
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
-- Same SECURITY DEFINER + scoping as the single-row variant.
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
       SET status  = 'read',
           read_at = now()
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
