-- =============================================================================
-- Add start_time to tournaments + H-1 tournament reminder
-- =============================================================================

-- New columns
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS start_time TIME;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS h1_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tournaments_h1_reminder_due
  ON public.tournaments (start_date, start_time)
  WHERE status IN ('scheduled', 'ongoing') AND h1_reminder_sent_at IS NULL AND start_time IS NOT NULL;

-- =============================================================================
-- Update H-30 tournament reminder to respect start_time when present
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_h30_tournament_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tournament RECORD;
  v_org_name   TEXT;
  v_date_label TEXT;
  v_time_label TEXT;
  v_count      INTEGER := 0;
BEGIN
  FOR v_tournament IN
    SELECT t.*
      FROM public.tournaments t
     WHERE t.status IN ('scheduled', 'ongoing')
       AND t.h30_reminder_sent_at IS NULL
       AND (
         -- Has start_time: fire in the 30-45 min window before match
         (t.start_time IS NOT NULL
          AND (t.start_date + t.start_time) AT TIME ZONE 'Asia/Jakarta'
              BETWEEN now() + interval '30 minutes' AND now() + interval '45 minutes')
         OR
         -- No start_time: fire anytime on start_date (legacy behaviour)
         (t.start_time IS NULL
          AND t.start_date = (now() AT TIME ZONE 'Asia/Jakarta')::date)
       )
  LOOP
    SELECT name INTO v_org_name FROM public.organizations
      WHERE id = v_tournament.organization_id;

    v_date_label := to_char(v_tournament.start_date, 'DD Mon YYYY');
    v_time_label := CASE
      WHEN v_tournament.start_time IS NOT NULL
        THEN to_char(v_tournament.start_time, 'HH24:MI') || ' WIB'
      ELSE NULL
    END;

    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body, ref_id, ref_type,
       wa_number, wa_message)
    SELECT
      v_tournament.organization_id,
      tm.user_id,
      'system'::notification_type,
      'Turnamen 30 menit lagi: ' || v_tournament.name,
      'Turnamen ' || v_tournament.name || ' dimulai 30 menit lagi!'
        || COALESCE(' Jam ' || v_time_label || '.', ''),
      v_tournament.id,
      'tournament',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN '⏰ [' || v_org_name || '] Turnamen dimulai 30 menit lagi!' || E'\n\n'
          || '*Nama:* ' || v_tournament.name || E'\n'
          || COALESCE('*Organizer:* ' || v_tournament.organizer || E'\n', '')
          || '*Tanggal:* ' || v_date_label || E'\n'
          || COALESCE('*Jam:* ' || v_time_label || E'\n', '')
          || E'\n' || 'Pastikan tim sudah siap!'
        ELSE NULL
      END
    FROM public.team_members tm
    JOIN public.profiles p ON p.id = tm.user_id
    WHERE tm.organization_id = v_tournament.organization_id
      AND tm.is_active = true;

    UPDATE public.tournaments SET h30_reminder_sent_at = now()
      WHERE id = v_tournament.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- =============================================================================
-- H-1 tournament reminder (only for tournaments with start_time)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_h1_tournament_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tournament RECORD;
  v_org_name   TEXT;
  v_time_label TEXT;
  v_count      INTEGER := 0;
BEGIN
  FOR v_tournament IN
    SELECT t.*
      FROM public.tournaments t
     WHERE t.status IN ('scheduled', 'ongoing')
       AND t.start_time IS NOT NULL
       AND t.h1_reminder_sent_at IS NULL
       AND (t.start_date + t.start_time) AT TIME ZONE 'Asia/Jakarta'
           BETWEEN now() + interval '60 minutes' AND now() + interval '75 minutes'
  LOOP
    SELECT name INTO v_org_name FROM public.organizations
      WHERE id = v_tournament.organization_id;

    v_time_label := to_char(v_tournament.start_time, 'HH24:MI');

    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body, ref_id, ref_type,
       wa_number, wa_message)
    SELECT
      v_tournament.organization_id,
      tm.user_id,
      'scrim_reminder'::notification_type,
      'Turnamen 1 jam lagi: ' || v_tournament.name,
      'Turnamen ' || v_tournament.name || ' dimulai jam ' || v_time_label || ' WIB.',
      v_tournament.id,
      'tournament',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN '⏰ [' || v_org_name || '] Turnamen 1 jam lagi!' || E'\n\n'
          || '*Nama:* ' || v_tournament.name || E'\n'
          || COALESCE('*Organizer:* ' || v_tournament.organizer || E'\n', '')
          || '*Jam:* ' || v_time_label || ' WIB' || E'\n'
          || E'\n' || 'Pastikan tim sudah siap!'
        ELSE NULL
      END
    FROM public.team_members tm
    JOIN public.profiles p ON p.id = tm.user_id
    WHERE tm.organization_id = v_tournament.organization_id
      AND tm.is_active = true;

    UPDATE public.tournaments SET h1_reminder_sent_at = now()
      WHERE id = v_tournament.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_h1_tournament_reminders() FROM PUBLIC;

SELECT cron.unschedule('enqueue-h1-tournament-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'enqueue-h1-tournament-reminders');

SELECT cron.schedule(
  'enqueue-h1-tournament-reminders',
  '*/5 * * * *',
  $cron$SELECT public.enqueue_h1_tournament_reminders();$cron$
);

-- =============================================================================
-- Update daily digest to show start_time in tournament lines
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
      FROM public.organizations WHERE id = v_org.organization_id;

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

    -- Include start_time in tournament lines if available
    SELECT string_agg(
      '🏆 Turnamen: ' || name
        || CASE WHEN start_time IS NOT NULL
             THEN ' – ' || to_char(start_time, 'HH24:MI') || ' WIB'
             ELSE ''
           END,
      E'\n'
    ) INTO v_tourn_lines
    FROM public.tournaments
    WHERE organization_id = v_org.organization_id
      AND status IN ('scheduled', 'ongoing')
      AND start_date = v_today;

    v_body_text := COALESCE(v_scrim_lines, '');
    IF v_tourn_lines IS NOT NULL THEN
      IF v_body_text <> '' THEN v_body_text := v_body_text || E'\n'; END IF;
      v_body_text := v_body_text || v_tourn_lines;
    END IF;

    v_title   := 'Hari ini ada ' || v_total_count || ' jadwal';
    v_wa_text := '📅 [' || v_org_name || '] Jadwal hari ini' || E'\n'
              || 'Ada ' || v_total_count || ' jadwal hari ini:' || E'\n\n'
              || v_body_text || E'\n\n'
              || 'Buka workspace tim untuk detail.';

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

    UPDATE public.scrims
       SET day_reminder_sent_at = now()
     WHERE organization_id = v_org.organization_id
       AND status = 'scheduled'
       AND day_reminder_sent_at IS NULL
       AND (scheduled_at AT TIME ZONE 'Asia/Jakarta')::date = v_today;

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
