-- =============================================================================
-- 20260516000001_game_results.sql
--
-- 1. Add BO2 and BO7 to match_format enum
-- 2. Create scrim_game_results table for per-game results
-- =============================================================================

-- Add new enum values
ALTER TYPE match_format ADD VALUE IF NOT EXISTS 'bo2';
ALTER TYPE match_format ADD VALUE IF NOT EXISTS 'bo7';

-- Per-game results table
CREATE TABLE IF NOT EXISTS public.scrim_game_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id    UUID NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  game_number INT NOT NULL CHECK (game_number >= 1 AND game_number <= 7),
  is_win      BOOLEAN NOT NULL,
  notes       TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scrim_id, game_number)
);

CREATE INDEX IF NOT EXISTS idx_scrim_game_results_scrim ON scrim_game_results(scrim_id);

-- RLS
ALTER TABLE scrim_game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_results_read_member" ON scrim_game_results
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM scrims s
    WHERE s.id = scrim_game_results.scrim_id
    AND public.is_member_of(s.organization_id)
  ));

CREATE POLICY "game_results_insert_captain" ON scrim_game_results
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM scrims s
    WHERE s.id = scrim_game_results.scrim_id
    AND public.is_captain_or_above(s.organization_id)
  ));
