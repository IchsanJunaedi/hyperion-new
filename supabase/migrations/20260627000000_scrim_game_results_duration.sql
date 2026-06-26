-- =============================================================================
-- Add duration_seconds column to scrim_game_results
-- Allows recording the duration of each individual game in a scrim.
-- =============================================================================

ALTER TABLE public.scrim_game_results
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
