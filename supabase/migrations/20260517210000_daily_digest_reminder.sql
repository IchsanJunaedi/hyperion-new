-- =============================================================================
-- Daily digest reminder
-- Sends 1 notification per team per day listing ALL scrims + tournaments
-- scheduled for that day. Fires as soon as the cron runs on match day.
-- If set for today it fires today; if set for May 20, it fires on May 20.
-- =============================================================================

ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS day_reminder_sent_at TIMESTAMPTZ;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS day_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scrims_day_reminder_due
  ON public.scrims (scheduled_at)
  WHERE status = 'scheduled' AND day_reminder_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tournaments_day_reminder_due
  ON public.tournaments (start_date)
  WHERE status IN ('scheduled', 'ongoing') AND day_reminder_sent_at IS NULL;

-- =============================================================================
-- enqueue_daily_digest_reminders()
-- Per org: collect every scrim + tournament happening today, build one
-- combined message, fan out to all active members, mark as sent.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_daily_digest_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org          RECORD;
  v_org_name     TEXT;
  v_today        DATE;
  v_scrim_count  INTEGER;
  v_tourn_count  INTEGER;
  v_total_count  INTEGER;
  v_scrim_lines  TEXT;
  v_tourn_lines  TEXT;
  v_body_text    TEXT;
  v_wa_text      TEXT;
  v_title        TEXT;
  v_count        INTEGER := 0;
BEGIN
  v_today := (now() AT TIME ZONE 'Asia/Jakarta')::date;

  -- Find orgs that have at least one unreminded event today
  FOR v_org IN
    SELECT DISTINCT organization_id
    FROM (
      SELECT organization_id
      FROM public.scrims
      WHERE status = 'scheduled'
        AND day_reminder_sent_at IS NULL
        AND (scheduled_at AT TIME ZONE 'Asia/Jakarta')::date = v_today
      UNION
      SELECT organization_id
      FROM public.tournaments
      WHERE status IN ('scheduled', 'ongoing')
        AND day_reminder_sent_at IS NULL
        AND start_date = v_today
    ) t
  LOOP
    SELECT name INTO v_org_name
      FROM public.organizations
     WHERE id = v_org.organization_id;

    -- Count ALL today's events for this org (not just unreminded ones,
    -- so the message reflects the complete picture if partially sent)
    SELECT count(*) INTO v_scrim_count
      FROM public.scrims
     WHERE organization_id = v_org.organization_id
       AND status = 'scheduled'
       AND (scheduled_at AT TIME ZONE 'Asia/Jakarta')::date = v_today;

    SELECT count(*) INTO v_tourn_count
      FROM public.tournaments
     WHERE organization_id = v_org.organization_id
       AND status IN ('scheduled', 'ongoing')
       AND start_date = v_today;

    v_total_count := v_scrim_count + v_tourn_count;

    -- Scrim lines sorted by start time
    SELECT string_agg(
      '🎮 Scrim vs ' || opponent_name
        || ' – ' || to_char(scheduled_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI')
        || ' WIB (' || upper(format::text) || ')',
      E'\n' ORDER BY scheduled_at
    ) INTO v_scrim_lines
    FROM public.scrims
    WHERE organization_id = v_org.organization_id
      AND status = 'scheduled'
      AND (scheduled_at AT TIME ZONE 'Asia/Jakarta')::date = v_today;

    -- Tournament lines
    SELECT string_agg('🏆 Turnamen: ' || name, E'\n')
      INTO v_tourn_lines
    FROM public.tournaments
    WHERE organization_id = v_org.organization_id
      AND status IN ('scheduled', 'ongoing')
      AND start_date = v_today;

    -- Combine into one body
    v_body_text := COALESCE(v_scrim_lines, '');
    IF v_tourn_lines IS NOT NULL THEN
      IF v_body_text <> '' THEN v_body_text := v_body_text || E'\n'; END IF;
      v_body_text := v_body_text || v_tourn_lines;
    END IF;

    v_title    := 'Hari ini ada ' || v_total_count || ' jadwal';
    v_wa_text  := '📅 [' || v_org_name || '] Jadwal hari ini' || E'\n'
               || 'Ada ' || v_total_count || ' jadwal hari ini:' || E'\n\n'
               || v_body_text || E'\n\n'
               || 'Buka workspace tim untuk detail.';

    -- Fan out to all active members in this org
    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body,
       ref_type, wa_number, wa_message)
    SELECT
      v_org.organization_id,
      tm.user_id,
      'scrim_reminder'::notification_type,
      v_title,
      v_body_text,
      'daily_digest',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL THEN v_wa_text ELSE NULL END
    FROM public.team_members tm
    JOIN public.profiles p ON p.id = tm.user_id
    WHERE tm.organization_id = v_org.organization_id
      AND tm.is_active = true;

    -- Mark today's scrims as day-reminded
    UPDATE public.scrims
       SET day_reminder_sent_at = now()
     WHERE organization_id = v_org.organization_id
       AND status = 'scheduled'
       AND day_reminder_sent_at IS NULL
       AND (scheduled_at AT TIME ZONE 'Asia/Jakarta')::date = v_today;

    -- Mark today's tournaments as day-reminded
    UPDATE public.tournaments
       SET day_reminder_sent_at = now()
     WHERE organization_id = v_org.organization_id
       AND status IN ('scheduled', 'ongoing')
       AND day_reminder_sent_at IS NULL
       AND start_date = v_today;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_daily_digest_reminders() FROM PUBLIC;

-- Run every 5 minutes so a same-day scrim fires within 5 minutes of creation
SELECT cron.unschedule('enqueue-daily-digest-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'enqueue-daily-digest-reminders');

SELECT cron.schedule(
  'enqueue-daily-digest-reminders',
  '*/5 * * * *',
  $cron$SELECT public.enqueue_daily_digest_reminders();$cron$
);
