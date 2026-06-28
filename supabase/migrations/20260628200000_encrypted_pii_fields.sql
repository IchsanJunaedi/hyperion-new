-- =============================================================================
-- 20260628200000_encrypted_pii_fields.sql
-- Add encrypted PII columns to profiles table.
-- Application-level AES-256-GCM encryption via lib/encryption.ts.
-- These columns store the encrypted ciphertext (iv:tag:ciphertext hex format).
-- The original columns remain for backward compatibility; new reads/writes
-- should use the encrypted variants once the app code is updated.
-- =============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encrypted_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encrypted_game_ids TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encrypted_social_links TEXT;
