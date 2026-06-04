-- Fix news_posts: add updated_at, tighten RLS

ALTER TABLE news_posts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Drop the over-permissive policy
DROP POLICY IF EXISTS "Admin full access" ON news_posts;

-- Public reads published posts only
CREATE POLICY "public read published news_posts" ON news_posts
  FOR SELECT TO anon USING (status = 'published');

-- Authenticated (admin panel) reads all
CREATE POLICY "authenticated read all news_posts" ON news_posts
  FOR SELECT TO authenticated USING (true);

-- Auto-update updated_at on edits (reuse existing trigger function)
CREATE TRIGGER trg_news_posts_updated_at
  BEFORE UPDATE ON news_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
