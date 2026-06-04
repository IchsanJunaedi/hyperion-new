-- Track which members have read each announcement
CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id)    ON DELETE CASCADE,
  read_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Users can mark their own reads
CREATE POLICY "Users insert own reads"
  ON announcement_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can see read records (for counts displayed to managers)
CREATE POLICY "Authenticated can read records"
  ON announcement_reads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_announcement_reads_ann ON announcement_reads(announcement_id);
