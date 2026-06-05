-- =============================================================================
-- Scrim coach summary
-- A single free-text overall evaluation for a whole scrim (distinct from the
-- per-player coach_notes in scrim_attendances and per-game VOD timestamps).
-- Editable by coach/captain/manager/owner; readable by all members via RLS on
-- the parent scrim row.
-- =============================================================================

ALTER TABLE public.scrims
  ADD COLUMN IF NOT EXISTS coach_summary TEXT;
