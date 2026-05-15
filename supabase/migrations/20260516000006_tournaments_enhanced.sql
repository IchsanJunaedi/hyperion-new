-- =============================================================================
-- 20260516000006_tournaments_enhanced.sql
-- Enhanced tournaments with registration status, timeline, and auto-status
-- =============================================================================

-- Add new columns to existing tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_fee TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_registered BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Replace scrim_status enum usage with a text check for more flexibility
ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
ALTER TABLE tournaments ALTER COLUMN status TYPE TEXT USING status::text;
ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check
  CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled'));
ALTER TABLE tournaments ALTER COLUMN status SET DEFAULT 'upcoming';

-- Tournament timeline stages
CREATE TABLE tournament_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  stage_name      TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tournament_stages_tournament ON tournament_stages(tournament_id);
CREATE INDEX idx_tournament_stages_date ON tournament_stages(scheduled_at);

-- RLS for tournament_stages
ALTER TABLE tournament_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tournament stages"
  ON tournament_stages FOR SELECT
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE organization_id IN (
        SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Captain+ can manage tournament stages"
  ON tournament_stages FOR ALL
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE organization_id IN (
        SELECT organization_id FROM team_members
        WHERE user_id = auth.uid() AND is_active = true AND role IN ('captain', 'manager', 'owner')
      )
    )
  );

-- Update RLS for tournaments table (add if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tournaments' AND policyname = 'Members can view tournaments') THEN
    ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Members can view tournaments"
      ON tournaments FOR SELECT
      USING (
        organization_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tournaments' AND policyname = 'Captain+ can manage tournaments') THEN
    CREATE POLICY "Captain+ can manage tournaments"
      ON tournaments FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true AND role IN ('captain', 'manager', 'owner')
        )
      );
  END IF;
END $$;
