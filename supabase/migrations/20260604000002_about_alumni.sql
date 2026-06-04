-- supabase/migrations/20260604000002_about_alumni.sql
CREATE TABLE about_alumni (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT '',
  image_url   TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE about_alumni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read about_alumni"  ON about_alumni FOR SELECT USING (true);
CREATE POLICY "Service role about_alumni" ON about_alumni USING (auth.role() = 'service_role');
