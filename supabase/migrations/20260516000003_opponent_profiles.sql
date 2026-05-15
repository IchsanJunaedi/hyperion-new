-- =============================================================================
-- 20260516000003_opponent_profiles.sql
-- Scouting info for opponent teams
-- =============================================================================

CREATE TABLE opponent_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opponent_name   TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_opponent_profiles_org ON opponent_profiles(organization_id);
CREATE INDEX idx_opponent_profiles_name ON opponent_profiles(opponent_name);

CREATE TRIGGER trg_opponent_profiles_updated_at
  BEFORE UPDATE ON opponent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE opponent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view opponent profiles"
  ON opponent_profiles FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Captain+ can manage opponent profiles"
  ON opponent_profiles FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('captain', 'manager', 'owner', 'coach')
    )
  );
