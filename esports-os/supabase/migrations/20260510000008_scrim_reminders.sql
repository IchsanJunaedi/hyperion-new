-- Auto-generate `scrim_reminder` notifications ~1 hour before each
-- scheduled scrim. Idempotent: tracks `reminder_sent_at` on the scrim
-- row so a second cron tick won't fan out duplicate WA messages.

-- Add a reminder bookkeeping column. Safe to re-run on existing rows.
ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scrims_reminder_due
  ON public.scrims (scheduled_at)
  WHERE status = 'scheduled' AND reminder_sent_at IS NULL;

-- Find scrims starting in the next 60–75 minutes that haven't been
-- reminded yet, fan out a `scrim_reminder` notification to every
-- confirmed/tentative attendee, and mark the scrim as reminded.
-- Runs with the cron-job security context (postgres) so it bypasses RLS.
CREATE OR REPLACE FUNCTION public.enqueue_scrim_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_scrim RECORD;
  v_member RECORD;
  v_org_name TEXT;
  v_scheduled_label TEXT;
  v_count INTEGER := 0;
BEGIN
  FOR v_scrim IN
    SELECT s.*
      FROM public.scrims s
     WHERE s.status = 'scheduled'
       AND s.reminder_sent_at IS NULL
       AND s.scheduled_at BETWEEN now() AND now() + interval '75 minutes'
       AND s.scheduled_at > now() + interval '30 minutes'
  LOOP
    SELECT name INTO v_org_name FROM public.organizations
      WHERE id = v_scrim.organization_id;

    v_scheduled_label := to_char(
      v_scrim.scheduled_at AT TIME ZONE 'Asia/Jakarta',
      'HH24:MI'
    );

    -- Insert one notif per confirmed/tentative member. Pending/declined
    -- members aren't reminded — the captain already saw the no-show.
    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body, ref_id, ref_type,
       wa_number, wa_message)
    SELECT
      v_scrim.organization_id,
      a.user_id,
      'scrim_reminder'::notification_type,
      'Scrim 1 jam lagi: vs ' || v_scrim.opponent_name,
      'Scrim ' || upper(v_scrim.format::text) || ' jam ' || v_scheduled_label
        || ' WIB. Pastikan kamu hadir tepat waktu.',
      v_scrim.id,
      'scrim',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN '[' || v_org_name || '] Pengingat scrim 1 jam lagi.' || E'\n'
          || '🎮 Lawan: ' || v_scrim.opponent_name || E'\n'
          || '⏰ Jam ' || v_scheduled_label || ' WIB' || E'\n'
          || COALESCE('🔐 Room: ' || v_scrim.room_info || E'\n', '')
          || 'Cek workspace tim untuk detail.'
        ELSE NULL
      END
    FROM public.scrim_attendances a
    JOIN public.profiles p ON p.id = a.user_id
    WHERE a.scrim_id = v_scrim.id
      AND a.status IN ('confirmed', 'tentative');

    UPDATE public.scrims SET reminder_sent_at = now()
      WHERE id = v_scrim.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_scrim_reminders() FROM PUBLIC;

-- Run every 5 minutes — overlaps with the WA queue cron but on a
-- different schedule so the two never collide.
SELECT cron.schedule(
  'enqueue-scrim-reminders',
  '*/5 * * * *',
  $cron$SELECT public.enqueue_scrim_reminders();$cron$
);
