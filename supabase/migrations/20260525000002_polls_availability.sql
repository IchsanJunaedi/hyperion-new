-- Add availability poll type to polls table
ALTER TABLE polls
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'regular'
    CHECK (type IN ('regular', 'availability')),
  ADD COLUMN IF NOT EXISTS availability_slots jsonb;

-- Multi-slot availability votes (separate from poll_votes to support UNIQUE per slot)
CREATE TABLE IF NOT EXISTS poll_availability_votes (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid         NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id    uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_index integer      NOT NULL,
  created_at timestamptz  NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_poll_availability_votes_poll ON poll_availability_votes(poll_id);

ALTER TABLE poll_availability_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view availability votes"
  ON poll_availability_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM polls p
      INNER JOIN team_members tm ON tm.organization_id = p.organization_id
      WHERE p.id = poll_availability_votes.poll_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can vote availability"
  ON poll_availability_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM polls p
      INNER JOIN team_members tm ON tm.organization_id = p.organization_id
      WHERE p.id = poll_availability_votes.poll_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can remove own availability vote"
  ON poll_availability_votes FOR DELETE
  USING (user_id = auth.uid());
