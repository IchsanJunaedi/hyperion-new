-- =============================================================================
-- 20260613030000_audit_log_retention.sql
--
-- Monthly pg_cron job: delete audit_logs older than 1 year.
-- Runs at 03:00 UTC on the 1st of each month.
-- pg_cron is already enabled (see 20260510000006_wa_queue_cron.sql).
-- =============================================================================

-- Idempotent: drop prior schedule if it exists
SELECT cron.unschedule('audit-log-retention')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'audit-log-retention');

SELECT cron.schedule(
  'audit-log-retention',
  '0 3 1 * *',
  $cron$
    DELETE FROM public.audit_logs
    WHERE created_at < now() - interval '1 year';
  $cron$
);
