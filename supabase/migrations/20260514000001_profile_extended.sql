-- =============================================================================
-- 20260514000001_profile_extended.sql
--
-- Extends profiles table with full_name, date_of_birth, and social_links
-- for the new registration flow where all members fill complete profiles.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

-- social_links structure: { "instagram": "url", "twitter": "url", "tiktok": "url", "youtube": "url", "discord": "tag" }

COMMENT ON COLUMN public.profiles.full_name IS 'Nama lengkap member';
COMMENT ON COLUMN public.profiles.date_of_birth IS 'Tanggal lahir member';
COMMENT ON COLUMN public.profiles.social_links IS 'Links sosial media: instagram, twitter, tiktok, youtube, discord';
