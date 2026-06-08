-- Add category and read_time to news_posts table
ALTER TABLE news_posts
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS read_time integer;
