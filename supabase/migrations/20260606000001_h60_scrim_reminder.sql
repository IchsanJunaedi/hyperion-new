-- =============================================================================
-- H-60 minute reminder for scrims
-- Sends a WA notification ~1 hour before a scrim starts. Fills the gap between
-- the existing H-24 hour and H-30 minute reminders.
-- Mirrors the pattern in 20260517200000_h30_reminders.sql.
-- =============================================================================

-- Add H-60 bookkeeping column to scrims
ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS h60_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scrims_h60_reminder_due
  ON public.scrims (scheduled_at)
  WHERE status = 'scheduled' AND h60_reminder_sent_at IS NULL;

-- =============================================================================
-- Scrim H-60 reminder function
-- Finds scrims starting in 55-65 minutes, sends reminder to ALL active members
-- =============================================================================
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

    -- Send to ALL active members in the org (not just confirmed attendees)
    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body, ref_id, ref_type,
       wa_number, wa_message)
    SELECT
      v_scrim.organization_id,
      tm.user_id,
      'scrim_reminder'::notification_type,
      'Scrim 1 jam lagi: vs ' || v_scrim.opponent_name,
      'Scrim ' || upper(v_scrim.format::text) || ' jam ' || v_scheduled_label
        || ' WIB dimulai 1 jam lagi!',
      v_scrim.id,
      'scrim',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN '⏰ [' || v_org_name || '] Scrim dimulai 1 jam lagi!' || E'\n'
          || E'\n'
          || '*Lawan:* ' || v_scrim.opponent_name || E'\n'
          || '*Waktu:* ' || v_scheduled_label || ' WIB' || E'\n'
          || '*Format:* ' || upper(v_scrim.format::text) || E'\n'
          || COALESCE('*Room:* ' || v_scrim.room_info || E'\n', '')
          || E'\n'
          || 'Mulai persiapan dari sekarang ya!'
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

-- Schedule to run every 5 minutes
SELECT cron.schedule(
  'enqueue-h60-scrim-reminders',
  '*/5 * * * *',
  $cron$SELECT public.enqueue_h60_scrim_reminders();$cron$
);
