-- =============================================================================
-- 20260521000000_add_scrim_draft_picks.sql
-- Draft picks (hero selection per role) for each game in a scrim
-- =============================================================================

CREATE TABLE scrim_draft_picks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id    UUID        NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  game_number INTEGER     NOT NULL,
  side        TEXT        NOT NULL CHECK (side IN ('our', 'enemy')),
  role        TEXT        NOT NULL CHECK (role IN ('exp_lane', 'jungler', 'mid_lane', 'gold_lane', 'roamer')),
  hero_name   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scrim_id, game_number, side, role)
);

CREATE INDEX idx_scrim_draft_picks_scrim ON scrim_draft_picks(scrim_id);

ALTER TABLE scrim_draft_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view draft picks"
  ON scrim_draft_picks FOR SELECT
  USING (
    scrim_id IN (
      SELECT s.id FROM scrims s
      WHERE s.organization_id IN (
        SELECT organization_id FROM team_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );
