-- =============================================================================
-- H-1 (60 minute) scrim reminder — message update + de-duplicate
--
-- The H-1 reminder already exists (enqueue_h60_scrim_reminders). This migration:
--   1. Rewrites the WA message to the requested tone:
--        "Halo! 1 jam lagi kamu scrim lawan <opponent>. Persiapkan dirimu
--         masing-masing ya!"
--      (time/format/room info kept for context).
--   2. Un schedules the older `enqueue-scrim-reminders` cron job, which also
--      fired ~60-75 minutes before start and would cause duplicate WA blasts
--      alongside enqueue_h60_scrim_reminders. The h60 job is the single source
--      of truth for the 1-hour reminder.
-- =============================================================================

-- Remove the duplicate older reminder schedule (if present).
SELECT cron.unschedule('enqueue-scrim-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'enqueue-scrim-reminders');

-- Replace the H-60 function with the updated WA copy.
CREATE OR REPLACE FUNCTION public.enqueue_h60_scrim_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_scrim RECORD;
  v_org_name TEXT;
  v_scheduled_label TEXT;
  v_count INTEGER := 0;
BEGIN
  FOR v_scrim IN
    SELECT s.*
      FROM public.scrims s
     WHERE s.status = 'scheduled'
       AND s.h60_reminder_sent_at IS NULL
       AND s.scheduled_at BETWEEN now() + interval '55 minutes'
                               AND now() + interval '65 minutes'
  LOOP
    SELECT name INTO v_org_name FROM public.organizations
      WHERE id = v_scrim.organization_id;

    v_scheduled_label := to_char(
      v_scrim.scheduled_at AT TIME ZONE 'Asia/Jakarta',
      'HH24:MI'
    );

    -- Send to ALL active members in the org (not just confirmed attendees).
    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body, ref_id, ref_type,
       wa_number, wa_message)
    SELECT
      v_scrim.organization_id,
      tm.user_id,
      'scrim_reminder'::notification_type,
      'Scrim 1 jam lagi: vs ' || v_scrim.opponent_name,
      'Halo! 1 jam lagi scrim vs ' || v_scrim.opponent_name
        || ' jam ' || v_scheduled_label || ' WIB. Persiapkan dirimu masing-masing.',
      v_scrim.id,
      'scrim',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN 'Halo! 1 jam lagi kamu scrim lawan ' || v_scrim.opponent_name || '.' || E'\n'
          || E'\n'
          || '*Waktu:* ' || v_scheduled_label || ' WIB' || E'\n'
          || '*Format:* ' || upper(v_scrim.format::text) || E'\n'
          || COALESCE('*Room:* ' || v_scrim.room_info || E'\n', '')
          || E'\n'
          || 'Persiapkan dirimu masing-masing ya!'
        ELSE NULL
      END
    FROM public.team_members tm
    JOIN public.profiles p ON p.id = tm.user_id
    WHERE tm.organization_id = v_scrim.organization_id
      AND tm.is_active = true;

    UPDATE public.scrims SET h60_reminder_sent_at = now()
      WHERE id = v_scrim.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_h60_scrim_reminders() FROM PUBLIC;

-- The cron schedule from 20260606000001 is left in place; no reschedule needed.
