-- Weekly digest cron: every Monday at 09:00 WIB (02:00 UTC)
-- Prerequisite: deploy supabase/functions/weekly-digest first
-- The edge function URL is https://pqzdukrlmbwjjgjyoqva.supabase.co/functions/v1/weekly-digest

SELECT cron.schedule(
  'hyperion-weekly-digest',
  '0 2 * * 1',
  $$
  SELECT net.http_post(
    url     := 'https://pqzdukrlmbwjjgjyoqva.supabase.co/functions/v1/weekly-digest',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
