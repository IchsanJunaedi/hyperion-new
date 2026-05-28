-- Add new fields to trial_applicants for extended registration form
ALTER TABLE trial_applicants
  ADD COLUMN IF NOT EXISTS city           TEXT,
  ADD COLUMN IF NOT EXISTS game_id        TEXT,
  ADD COLUMN IF NOT EXISTS game_nickname  TEXT,
  ADD COLUMN IF NOT EXISTS win_rate       TEXT,
  ADD COLUMN IF NOT EXISTS hero_pool      TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS competitive_exp TEXT,
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Storage bucket for trial applicant screenshots (public read, no-auth write via API route)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trial-screenshots',
  'trial-screenshots',
  true,
  5242880,
  ARRAY['image/png','image/jpeg','image/webp','image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read screenshots (public bucket)
CREATE POLICY "trial_screenshots_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trial-screenshots');

-- Service role handles writes (via API route using admin client — no anon insert needed)
