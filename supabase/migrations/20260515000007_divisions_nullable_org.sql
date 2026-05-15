-- =============================================================================
-- 20260515000002_divisions_nullable_org.sql
--
-- Make divisions.organization_id nullable so divisions can exist standalone
-- (not tied to any team). They get linked when assigned to a team.
-- =============================================================================

ALTER TABLE public.divisions ALTER COLUMN organization_id DROP NOT NULL;

-- Clean up: delete the hidden "__division-pool__" org if it exists
DELETE FROM organizations WHERE slug = '__division-pool__';
