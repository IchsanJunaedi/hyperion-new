-- =============================================================================
-- H-30 minute reminders for scrims and tournaments
-- Sends WA notification 30 minutes before scrim/tournament starts.
-- =============================================================================

-- Add H-30 bookkeeping column to scrims
ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS h30_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scrims_h30_reminder_due
  ON public.scrims (scheduled_at)
  WHERE status = 'scheduled' AND h30_reminder_sent_at IS NULL;

-- Add H-30 bookkeeping column to tournaments
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS h30_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tournaments_h30_reminder_due
  ON public.tournaments (start_date)
  WHERE status = 'ongoing' AND h30_reminder_sent_at IS NULL;

-- =============================================================================
-- Scrim H-30 reminder function
-- Finds scrims starting in 30-45 minutes, sends reminder to ALL active members
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_h30_scrim_reminders()
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
       AND s.h30_reminder_sent_at IS NULL
       AND s.scheduled_at BETWEEN now() + interval '30 minutes'
                               AND now() + interval '45 minutes'
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
      'Scrim 30 menit lagi: vs ' || v_scrim.opponent_name,
      'Scrim ' || upper(v_scrim.format::text) || ' jam ' || v_scheduled_label
        || ' WIB dimulai 30 menit lagi!',
      v_scrim.id,
      'scrim',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN '⏰ [' || v_org_name || '] Scrim dimulai 30 menit lagi!' || E'\n'
          || E'\n'
          || '*Lawan:* ' || v_scrim.opponent_name || E'\n'
          || '*Waktu:* ' || v_scheduled_label || ' WIB' || E'\n'
          || '*Format:* ' || upper(v_scrim.format::text) || E'\n'
          || COALESCE('*Room:* ' || v_scrim.room_info || E'\n', '')
          || E'\n'
          || 'Pastikan kamu sudah siap!'
        ELSE NULL
      END
    FROM public.team_members tm
    JOIN public.profiles p ON p.id = tm.user_id
    WHERE tm.organization_id = v_scrim.organization_id
      AND tm.is_active = true;

    UPDATE public.scrims SET h30_reminder_sent_at = now()
      WHERE id = v_scrim.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_h30_scrim_reminders() FROM PUBLIC;

-- =============================================================================
-- Tournament H-30 reminder (morning of start_date)
-- Since tournaments only have a date (no time), we send reminder at 07:00 WIB
-- on the start_date for tournaments with status 'ongoing' (registered).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_h30_tournament_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tournament RECORD;
  v_org_name TEXT;
  v_org_slug TEXT;
  v_date_label TEXT;
  v_count INTEGER := 0;
BEGIN
  FOR v_tournament IN
    SELECT t.*
      FROM public.tournaments t
     WHERE t.status = 'ongoing'
       AND t.h30_reminder_sent_at IS NULL
       -- Start date is today (in WIB timezone)
       AND t.start_date = (now() AT TIME ZONE 'Asia/Jakarta')::date
  LOOP
    SELECT name, slug INTO v_org_name, v_org_slug FROM public.organizations
      WHERE id = v_tournament.organization_id;

    v_date_label := to_char(v_tournament.start_date, 'DD Mon YYYY');

    -- Send to ALL active members in the org
    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body, ref_id, ref_type,
       wa_number, wa_message)
    SELECT
      v_tournament.organization_id,
      tm.user_id,
      'system'::notification_type,
      'Turnamen hari ini: ' || v_tournament.name,
      'Turnamen ' || v_tournament.name || ' dimulai hari ini (' || v_date_label || ').',
      v_tournament.id,
      'tournament',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN '⏰ [' || v_org_name || '] Turnamen dimulai hari ini!' || E'\n'
          || E'\n'
          || '*Nama:* ' || v_tournament.name || E'\n'
          || COALESCE('*Organizer:* ' || v_tournament.organizer || E'\n', '')
          || '*Tanggal:* ' || v_date_label || E'\n'
          || E'\n'
          || 'Pastikan tim sudah siap!'
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

REVOKE ALL ON FUNCTION public.enqueue_h30_tournament_reminders() FROM PUBLIC;

-- Schedule both functions to run every 5 minutes
SELECT cron.schedule(
  'enqueue-h30-scrim-reminders',
  '*/5 * * * *',
  $cron$SELECT public.enqueue_h30_scrim_reminders();$cron$
);

SELECT cron.schedule(
  'enqueue-h30-tournament-reminders',
  '*/5 * * * *',
  $cron$SELECT public.enqueue_h30_tournament_reminders();$cron$
);
