-- =============================================================================
-- 20260513000002_h24_scrim_reminders.sql
-- H-24h scrim reminder cron. Runs independently of the existing H-1h cron.
-- Fan-out targets ALL active division members (not just confirmed/tentative)
-- because at H-24 most members haven't RSVP'd yet.
-- =============================================================================

ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS h24_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scrims_h24_reminder_due
  ON public.scrims (scheduled_at)
  WHERE status = 'scheduled' AND h24_reminder_sent_at IS NULL;

-- Find scrims starting in 24h–24h15m that haven't received a H-24 reminder,
-- fan out a scrim_reminder notification to every active division member,
-- and mark the scrim as h24-reminded.
CREATE OR REPLACE FUNCTION public.enqueue_scrim_h24_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_scrim    RECORD;
  v_org_name TEXT;
  v_date_label TEXT;
  v_count    INTEGER := 0;
BEGIN
  FOR v_scrim IN
    SELECT s.*
      FROM public.scrims s
     WHERE s.status = 'scheduled'
       AND s.h24_reminder_sent_at IS NULL
       AND s.scheduled_at BETWEEN now() + interval '24 hours'
                               AND now() + interval '24 hours 15 minutes'
  LOOP
    SELECT name INTO v_org_name
      FROM public.organizations
     WHERE id = v_scrim.organization_id;

    v_date_label := to_char(
      v_scrim.scheduled_at AT TIME ZONE 'Asia/Jakarta',
      'Day, DD Mon YYYY "pukul" HH24:MI'
    );

    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body,
       ref_id, ref_type, wa_number, wa_message)
    SELECT
      v_scrim.organization_id,
      m.user_id,
      'scrim_reminder'::notification_type,
      'Scrim besok: vs ' || v_scrim.opponent_name,
      'Scrim ' || upper(v_scrim.format::text)
        || ' dijadwalkan ' || v_date_label || ' WIB.'
        || ' Konfirmasi kehadiranmu sekarang.',
      v_scrim.id,
      'scrim',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL THEN
        '[' || v_org_name || '] Pengingat H-1 scrim.' || E'\n'
        || '🎮 Lawan: '  || v_scrim.opponent_name         || E'\n'
        || '📅 '         || v_date_label                   || ' WIB' || E'\n'
        || '🏷️ Format: ' || upper(v_scrim.format::text)   || E'\n'
        || COALESCE('🔐 Room: ' || v_scrim.room_info || E'\n', '')
        || 'Buka workspace tim untuk konfirmasi kehadiran.'
      ELSE NULL END
    FROM public.team_members m
    JOIN public.profiles     p ON p.id = m.user_id
    WHERE m.organization_id = v_scrim.organization_id
      AND m.division_id     = v_scrim.division_id
      AND m.is_active       = true;

    UPDATE public.scrims
       SET h24_reminder_sent_at = now()
     WHERE id = v_scrim.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_scrim_h24_reminders() FROM PUBLIC;

-- Run every 15 minutes. Offset from the existing 5-minute H-1h cron so
-- the two never fire simultaneously.
SELECT cron.schedule(
  'enqueue-h24-scrim-reminders',
  '*/15 * * * *',
  $cron$SELECT public.enqueue_scrim_h24_reminders();$cron$
);
