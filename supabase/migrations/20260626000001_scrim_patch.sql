-- =============================================================================
-- Add patch (game version) column to scrims
-- Allows recording which game patch a scrim was played on.
-- =============================================================================

ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS patch TEXT;
