-- =============================================================================
-- 20260516000004_polls.sql
-- Internal team polling system
-- =============================================================================

CREATE TABLE polls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  options         JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  expires_at      TIMESTAMPTZ,
  is_closed       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_polls_org ON polls(organization_id);
CREATE INDEX idx_polls_created ON polls(created_at DESC);

CREATE TABLE poll_votes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id      UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index SMALLINT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);

CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);

-- RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view polls"
  ON polls FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Captain+ can create polls"
  ON polls FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('captain', 'manager', 'owner')
    )
  );

CREATE POLICY "Creator can update polls"
  ON polls FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Members can view votes"
  ON poll_votes FOR SELECT
  USING (
    poll_id IN (
      SELECT id FROM polls WHERE organization_id IN (
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Members can vote"
  ON poll_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND poll_id IN (
      SELECT id FROM polls WHERE organization_id IN (
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );
