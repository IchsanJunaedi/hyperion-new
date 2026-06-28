-- =============================================================================
-- 20260628195000_fix_backfill_phone_hash.sql
-- Fix incorrectly backfilled phone_hash values from migration 20260628190000.
-- 
-- Bug in previous migration: phone_wa yang dimulai dengan "+62" tidak dihandle
-- dengan benar, menghasilkan hash yang salah (e.g., "+62812" → "6262812" padahal
-- harus "62812").
--
-- Fix: Reset semua phone_hash yang sudah terisi, lalu backfill ulang dengan
-- logika yang benar: strip non-digits DULU, baru cek prefix.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1: Reset phone_hash yang salah (hanya yang terisi by previous migration)
UPDATE profiles
SET phone_hash = NULL
WHERE phone_wa IS NOT NULL
  AND phone_wa != '';

-- Step 2: Backfill ulang dengan CTE yang strip non-digits dulu
WITH normalized AS (
  SELECT
    id,
    regexp_replace(phone_wa, '\D', '', 'g') AS clean_phone
  FROM profiles
  WHERE phone_wa IS NOT NULL
    AND phone_wa != ''
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
