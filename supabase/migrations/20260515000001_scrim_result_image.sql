-- =============================================================================
-- 20260515000001_scrim_result_image.sql
-- Add result_image_path column to scrim_results for uploading match screenshots.
-- =============================================================================

ALTER TABLE scrim_results
  ADD COLUMN IF NOT EXISTS result_image_path TEXT NULL;
