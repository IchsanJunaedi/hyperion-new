-- =============================================================================
-- 20260510000006_wa_queue_cron.sql
--
-- pg_cron job that pings the `process-wa-queue` Edge Function every minute.
-- The Edge Function pulls pending WhatsApp notifications, sends them via
-- Fonnte, and updates `notifications.status`.
--
-- Required Supabase Vault secrets (set in dashboard → Project Settings →
-- Vault, OR via SQL after migration):
--
--   project_url        e.g. 'https://tbuxtlbtjpoholcflmoy.supabase.co'
--   service_role_key   the project's service role key
--
-- Add them with:
--   SELECT vault.create_secret('https://tbuxtlbtjpoholcflmoy.supabase.co', 'project_url');
--   SELECT vault.create_secret('<the service role key>', 'service_role_key');
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- Wrapper function so the cron job stays readable and we can null-guard
-- the vault lookups. Only postgres / service-role should ever call this.
CREATE OR REPLACE FUNCTION public.trigger_process_wa_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  v_url    text;
  v_anon   text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE NOTICE
      'trigger_process_wa_queue skipped: missing vault secrets project_url / service_role_key';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/process-wa-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body    := jsonb_build_object('triggered_by', 'pg_cron'),
    timeout_milliseconds := 5000
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trigger_process_wa_queue() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_process_wa_queue() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_process_wa_queue() FROM anon;

-- Schedule every minute. Idempotent: drops any prior schedule with the same name.
SELECT cron.unschedule('process-wa-queue')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-wa-queue');

SELECT cron.schedule(
  'process-wa-queue',
  '* * * * *',
  $cron$ SELECT public.trigger_process_wa_queue(); $cron$
);
