-- =============================================================================
-- Limit daily digest reminders to morning hours (before 09:00 AM Asia/Jakarta)
--
-- This prevents enqueuing a "Jadwal hari ini" digest late in the day when a
-- same-day scrim is created, which leads to duplicate blasts alongside the
-- H-1 reminder and lists past events.
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
  v_current_hour DOUBLE PRECISION;
BEGIN
  v_today := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_current_hour := date_part('hour', now() AT TIME ZONE 'Asia/Jakarta');

  -- If it is past 09:00 AM Asia/Jakarta, do NOT send daily digests.
  -- Quietly mark today's events as reminded so they don't trigger later.
  IF v_current_hour >= 9 THEN
    UPDATE public.scrims
       SET day_reminder_sent_at = now()
     WHERE status = 'scheduled'
       AND day_reminder_sent_at IS NULL
       AND (scheduled_at AT TIME ZONE 'Asia/Jakarta')::date = v_today;

    UPDATE public.tournaments
       SET day_reminder_sent_at = now()
     WHERE status IN ('scheduled', 'ongoing')
       AND day_reminder_sent_at IS NULL
       AND start_date = v_today;

    RETURN 0;
  END IF;

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
  -- Limit loop so we don't process deleted orgs
  LOOP
    SELECT name INTO v_org_name
      FROM public.organizations
     WHERE id = v_org.organization_id;

    IF v_org_name IS NULL THEN
      CONTINUE;
    END IF;

    -- Count ALL today's events for this org
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
