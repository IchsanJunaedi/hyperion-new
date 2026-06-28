-- =============================================================================
-- 20260628180000_phone_hash_profiles.sql
-- P2: Add phone_hash column to profiles for deterministic lookup.
-- The phone_wa field remains as-is for display, but lookups now use the hash.
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_hash text;

-- Index for fast phone lookups (used by WA webhook)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_hash ON profiles(phone_hash);
