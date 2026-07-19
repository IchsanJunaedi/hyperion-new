-- =============================================================================
-- Fix scrim reminder message copy
--
-- Bug: H-30 reminder (fires 30-45 min before scrim) mengatakan "30 menit lagi"
--      padahal bisa saja datang 45 menit sebelum scrim → misleading.
--
-- H-60 reminder (fires 55-65 min before scrim) mengatakan "1 jam lagi"
--      tapi bisa saja datang 55 menit sebelum → juga kurang tepat.
--
-- Fix: Ganti estimasi waktu "X menit lagi" dengan waktu aktual scrim (HH:MM WIB).
--      User tahu kapan scrimnya, tidak perlu tebak-tebakan.
-- =============================================================================

-- =============================================================================
-- Rewrite H-30 scrim reminder — tampilkan jam aktual, bukan "30 menit lagi"
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_h30_scrim_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_scrim           RECORD;
  v_org_name        TEXT;
  v_scheduled_label TEXT;
  v_count           INTEGER := 0;
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

    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body, ref_id, ref_type,
       wa_number, wa_message)
    SELECT
      v_scrim.organization_id,
      tm.user_id,
      'scrim_reminder'::notification_type,
      'Scrim sebentar lagi: vs ' || v_scrim.opponent_name,
      'Scrim vs ' || v_scrim.opponent_name || ' dimulai jam ' || v_scheduled_label || ' WIB. Bersiap!',
      v_scrim.id,
      'scrim',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN '⏰ [' || v_org_name || '] Scrim sebentar lagi!' || E'\n'
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
-- Rewrite H-60 scrim reminder — tampilkan jam aktual, bukan "1 jam lagi"
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enqueue_h60_scrim_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_scrim           RECORD;
  v_org_name        TEXT;
  v_scheduled_label TEXT;
  v_count           INTEGER := 0;
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

    INSERT INTO public.notifications
      (organization_id, user_id, type, title, body, ref_id, ref_type,
       wa_number, wa_message)
    SELECT
      v_scrim.organization_id,
      tm.user_id,
      'scrim_reminder'::notification_type,
      'Scrim jam ' || v_scheduled_label || ': vs ' || v_scrim.opponent_name,
      'Halo! Scrim vs ' || v_scrim.opponent_name
        || ' jam ' || v_scheduled_label || ' WIB. Mulai persiapan sekarang!',
      v_scrim.id,
      'scrim',
      p.phone_wa,
      CASE WHEN p.phone_wa IS NOT NULL
        THEN 'Halo! Scrim kamu jam ' || v_scheduled_label || ' WIB lawan ' || v_scrim.opponent_name || '.' || E'\n'
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
