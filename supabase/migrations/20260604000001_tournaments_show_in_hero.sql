-- Add show_in_hero column to tournaments table
-- Allows admin to flag exactly one tournament to display as countdown on landing page

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS show_in_hero BOOLEAN DEFAULT false;
