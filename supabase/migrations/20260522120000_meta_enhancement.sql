-- Extend tier constraint to include SS
ALTER TABLE meta_hero_ratings
  DROP CONSTRAINT IF EXISTS meta_hero_ratings_tier_check;
ALTER TABLE meta_hero_ratings
  ADD CONSTRAINT meta_hero_ratings_tier_check
  CHECK (tier IN ('SS', 'S', 'A', 'B', 'C', 'D'));

-- New columns on meta_hero_ratings
ALTER TABLE meta_hero_ratings
  ADD COLUMN IF NOT EXISTS counters text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS synergies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS draft_notes text;

-- New column on meta_patches
ALTER TABLE meta_patches
  ADD COLUMN IF NOT EXISTS tier_descriptions jsonb;
