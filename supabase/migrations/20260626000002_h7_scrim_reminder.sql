-- =============================================================================
-- H-7 day reminder for scrims
-- When a scrim is scheduled more than 7 days away, we skip the immediate
-- WA blast and instead send this reminder exactly 7 days before.
-- Mirrors the pattern in 20260606000001_h60_scrim_reminder.sql.
-- =============================================================================

-- Add H-7 bookkeeping column to scrims
ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS h7_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scrims_h7_reminder_due
  ON public.scrims (scheduled_at)
  WHERE status = 'scheduled' AND h7_reminder_sent_at IS NULL;

-- =============================================================================
-- Scrim H-7 reminder function
-- Finds scrims starting in 6d 23h – 7d 01h, sends WA reminder to all active
-- members (same target as the existing H-30 and H-60 reminders).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_h7_scrim_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_scrim            RECORD;
  v_org_name         TEXT;
  v_scheduled_label  TEXT;
  v_date_label       TEXT;
  v_count            INTEGER := 0;
BEGIN
  FOR v_scrim IN
    SELECT s.*
      FROM public.scrims s
     WHERE s.status = 'scheduled'
       AND s.h7_reminder_sent_at IS NULL
       -- Fire in the window 6d 23h – 7d 1h before the scrim
       AND s.scheduled_at BETWEEN now() + interval '6 days 23 hours'
                               AND now() + interval '7 days 1 hour'
  LOOP
    SELECT name INTO v_org_name FROM public.organizations
      WHERE id = v_scrim.organization_id;

    v_scheduled_label := to_char(
      v_scrim.scheduled_at AT TIME ZONE 'Asia/Jakarta',
      'HH24:MI'
    );
    v_date_label := to_char(
      v_scrim.scheduled_at AT TIME ZONE 'Asia/Jakarta',
      'DD Mon YYYY'
    );

    -- Send to ALL active members in the org
    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body, ref_id, ref_type,
       wa_number, wa_message)
    SELECT
      v_scrim.organization_id,
      tm.user_id,
      'scrim_reminder'::notification_type,
      'Scrim 7 hari lagi: vs ' || v_scrim.opponent_name,
      'Scrim ' || upper(v_scrim.format::text) || ' vs ' || v_scrim.opponent_name
        || ' dijadwalkan ' || v_date_label || ' jam ' || v_scheduled_label || ' WIB.',
      v_scrim.id,
      'scrim',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN '📅 [' || v_org_name || '] Pengingat scrim 7 hari lagi!' || E'\n'
          || E'\n'
          || '*Lawan:* ' || v_scrim.opponent_name || E'\n'
          || '*Tanggal:* ' || v_date_label || E'\n'
          || '*Waktu:* ' || v_scheduled_label || ' WIB' || E'\n'
          || '*Format:* ' || upper(v_scrim.format::text) || E'\n'
          || COALESCE('*Room:* ' || v_scrim.room_info || E'\n', '')
          || E'\n'
          || 'Persiapkan strategi dari sekarang!'
        ELSE NULL
      END
    FROM public.team_members tm
    JOIN public.profiles p ON p.id = tm.user_id
    WHERE tm.organization_id = v_scrim.organization_id
      AND tm.is_active = true;

    UPDATE public.scrims SET h7_reminder_sent_at = now()
      WHERE id = v_scrim.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_h7_scrim_reminders() FROM PUBLIC;

-- Schedule to run every 30 minutes (7-day window is wide enough)
SELECT cron.schedule(
  'enqueue-h7-scrim-reminders',
  '*/30 * * * *',
  $cron$SELECT public.enqueue_h7_scrim_reminders();$cron$
);
