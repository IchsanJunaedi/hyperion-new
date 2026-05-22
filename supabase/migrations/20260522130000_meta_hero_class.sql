-- Add hero_class column to meta_hero_ratings
ALTER TABLE meta_hero_ratings ADD COLUMN IF NOT EXISTS hero_class text;
