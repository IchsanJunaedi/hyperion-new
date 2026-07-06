-- Add opponent_id column to scrims table
-- Stores the in-game ID / username of the opponent team representative
ALTER TABLE scrims ADD COLUMN IF NOT EXISTS opponent_id TEXT NULL;
