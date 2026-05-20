-- =============================================================================
-- 20260521100000_scrim_analytics_v2.sql
-- Enterprise analytics schema additions:
--   1. scrim_draft_picks  → player_id (nullable link to roster member)
--   2. team_members       → main_role (preferred ML-BB role)
--   3. scrim_attendances  → rating (0-10) + coach_notes (per-player evaluation)
-- =============================================================================

-- 1. Link draft picks to the actual player who played that slot
ALTER TABLE scrim_draft_picks
  ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_scrim_draft_picks_player
  ON scrim_draft_picks(player_id)
  WHERE player_id IS NOT NULL;

-- 2. Primary role assignment per roster member (used for auto-assign in draft)
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS main_role TEXT
  CHECK (
    main_role IS NULL OR
    main_role IN ('exp_lane', 'jungler', 'mid_lane', 'gold_lane', 'roamer')
  );

-- 3. Per-player match evaluation (rating + qualitative notes) per scrim
ALTER TABLE scrim_attendances
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1)
    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  ADD COLUMN IF NOT EXISTS coach_notes TEXT;
