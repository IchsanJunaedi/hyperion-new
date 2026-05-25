-- =============================================================================
-- 20260525150000_tournament_bracket.sql
-- Add bracket_link and bracket_file_path columns to tournaments
-- =============================================================================

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS bracket_link TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS bracket_file_path TEXT;
