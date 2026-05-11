-- =============================================================================
-- 20260510000002_rls_helpers.sql
-- SECURITY DEFINER helper functions used inside RLS policies. Defining
-- them as SECURITY DEFINER + STABLE means policies can call them without
-- triggering recursive RLS evaluation on team_members itself.
-- =============================================================================

-- is_member_of(org) -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_member_of(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;

-- get_member_role(org) ----------------------------------------------------------
-- When a user has multiple rows in an org (one per division), returns the
-- highest-priority role: owner > captain > manager > coach > member.
CREATE OR REPLACE FUNCTION public.get_member_role(org_id UUID)
RETURNS member_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role
  FROM public.team_members
  WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND is_active = true
  ORDER BY array_position(
    ARRAY['owner','captain','manager','coach','member']::text[],
    role::text
  )
  LIMIT 1;
$$;

-- is_captain_or_above(org) ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_captain_or_above(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role IN ('owner','captain','manager')
      AND is_active = true
  );
$$;

-- Lock the helpers down: anon should not be able to introspect them, but
-- authenticated callers (and RLS policies, which run as the caller) need
-- EXECUTE privileges.
REVOKE ALL ON FUNCTION public.is_member_of(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_member_role(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_captain_or_above(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_captain_or_above(UUID) TO authenticated;
