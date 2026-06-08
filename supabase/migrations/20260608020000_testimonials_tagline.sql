-- Add tagline to testimonials table
ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS tagline text;
