-- =============================================================================
-- 20260513000001_member_availability.sql
--
-- Adds a tri-state availability enum to team_members so captains can see
-- who is active, on hiatus, or unavailable without pinging individually.
-- =============================================================================

-- Create the enum type
CREATE TYPE public.member_availability AS ENUM ('active', 'hiatus', 'unavailable');

-- Add the column with a default of 'active' (backward-compatible with
-- the existing is_active boolean — active members get 'active' status)
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS availability public.member_availability NOT NULL DEFAULT 'active';

-- Index for filtering by availability (captain dashboard queries)
CREATE INDEX IF NOT EXISTS idx_team_members_availability
  ON public.team_members (organization_id, availability)
  WHERE is_active = true;
