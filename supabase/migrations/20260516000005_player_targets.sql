-- =============================================================================
-- 20260516000005_player_targets.sql
-- Player development tracker + coach skill targets
-- =============================================================================

CREATE TABLE player_targets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name      TEXT NOT NULL,
  target_level    SMALLINT NOT NULL CHECK (target_level BETWEEN 1 AND 10),
  current_level   SMALLINT NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 10),
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_targets_org ON player_targets(organization_id);
CREATE INDEX idx_player_targets_user ON player_targets(user_id);

CREATE TRIGGER trg_player_targets_updated_at
  BEFORE UPDATE ON player_targets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Track history for chart/graph
CREATE TABLE player_target_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id       UUID NOT NULL REFERENCES player_targets(id) ON DELETE CASCADE,
  level           SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 10),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_target_history_target ON player_target_history(target_id);
CREATE INDEX idx_player_target_history_date ON player_target_history(recorded_at);

-- RLS
ALTER TABLE player_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_target_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view targets in their org"
  ON player_targets FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Coach/Captain+ can manage targets"
  ON player_targets FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('coach', 'captain', 'manager', 'owner')
    )
  );

CREATE POLICY "Members can view target history"
  ON player_target_history FOR SELECT
  USING (
    target_id IN (
      SELECT id FROM player_targets WHERE organization_id IN (
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Coach/Captain+ can insert history"
  ON player_target_history FOR INSERT
  WITH CHECK (
    target_id IN (
      SELECT id FROM player_targets WHERE organization_id IN (
        SELECT organization_id FROM team_members
        WHERE user_id = auth.uid() AND is_active = true AND role IN ('coach', 'captain', 'manager', 'owner')
      )
    )
  );
