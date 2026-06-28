-- =============================================================================
-- 20260628190000_backfill_phone_hash.sql
-- Backfill phone_hash for existing profiles with phone_wa set.
-- SHA-256 hashing is done via pgcrypto extension.
-- Phone normalization: strip non-digits FIRST, then ensure starts with "62".
-- Using CTE to normalize digits first handles formats like +62812, 0812, 62812.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH normalized AS (
  SELECT
    id,
    regexp_replace(phone_wa, '\D', '', 'g') AS clean_phone
  FROM profiles
  WHERE phone_wa IS NOT NULL
    AND phone_wa != ''
    AND phone_hash IS NULL
)
UPDATE profiles p
SET phone_hash = encode(
  sha256(
    CASE
      WHEN n.clean_phone ~ '^62' THEN n.clean_phone
      WHEN n.clean_phone ~ '^0'  THEN '62' || substring(n.clean_phone from 2)
      ELSE '62' || n.clean_phone
    END::bytea
  ),
  'hex'
)
FROM normalized n
WHERE p.id = n.id;
