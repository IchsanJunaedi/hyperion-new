-- =============================================================================
-- 20260516000002_calendar_rls_policies.sql
-- Calendar RLS Policies: Comprehensive access control for calendar system
--
-- Permission Model:
-- - Owner: Full access to all calendars and events in organization
-- - Manager: Can view/edit calendars in team, create new calendars
-- - Coach: Can view calendars in team
-- - Captain: Can create/view/edit/delete own calendars (created_by = auth.uid())
-- - Member: Can view based on visibility rules
--
-- Visibility Levels:
-- - private: Only creator
-- - management-only: Owner, Manager, Coach
-- - captain-only: Owner, Manager, Coach, Captain
-- - team-only: All active team members
-- - selected-members: Only members with explicit permission
-- - public-workspace: All organization members
-- =============================================================================

-- ============================================================================
-- HELPER: Get user's role in organization
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_org_role(
  p_user_id UUID,
  p_org_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if owner
  IF p_user_id = (SELECT owner_id FROM organizations WHERE id = p_org_id LIMIT 1) THEN
    RETURN 'owner';
  END IF;

  -- Check team_members for role
  SELECT role INTO v_role
  FROM team_members tm
  WHERE tm.user_id = p_user_id
    AND tm.organization_id = p_org_id
    AND tm.is_active = true
  LIMIT 1;

  RETURN COALESCE(v_role, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_org_role IS 'Get user role in organization: owner, manager, coach, captain, member, or NULL';

-- ============================================================================
-- HELPER: Check if user is in team with specific role
-- ============================================================================
CREATE OR REPLACE FUNCTION is_user_in_team_with_role(
  p_user_id UUID,
  p_org_id UUID,
  p_required_roles TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Owner always passes
  IF p_user_id = (SELECT owner_id FROM organizations WHERE id = p_org_id LIMIT 1) THEN
    RETURN true;
  END IF;

  -- Check team_members with required roles
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = p_user_id
      AND organization_id = p_org_id
      AND is_active = true
      AND role = ANY(p_required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_user_in_team_with_role IS 'Check if user has one of the required roles in organization';

-- ============================================================================
-- HELPER: Check event visibility for user
-- ============================================================================
CREATE OR REPLACE FUNCTION check_event_visibility(
  p_user_id UUID,
  p_event_id UUID,
  p_org_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_visibility TEXT;
  v_allowed_members UUID[];
  v_calendar_id UUID;
  v_user_role TEXT;
BEGIN
  v_user_role := get_user_org_role(p_user_id, p_org_id);

  -- Get event visibility (or calendar's default visibility)
  SELECT ev.visibility, ev.allowed_member_ids, ev.calendar_id
  INTO v_visibility, v_allowed_members, v_calendar_id
  FROM event_visibility ev
  WHERE ev.event_id = p_event_id
  LIMIT 1;

  -- If no event-specific visibility, use calendar's visibility
  IF v_visibility IS NULL THEN
    SELECT cc.visibility
    INTO v_visibility
    FROM calendar_configs cc
    WHERE cc.id = (
      SELECT calendar_id FROM calendar_events WHERE id = p_event_id LIMIT 1
    )
    LIMIT 1;
  END IF;

  -- If still no visibility found, deny access
  IF v_visibility IS NULL THEN
    RETURN false;
  END IF;

  -- Apply visibility rules
  CASE v_visibility
    WHEN 'private' THEN
      -- Only creator
      RETURN p_user_id = (SELECT created_by FROM calendar_events WHERE id = p_event_id);

    WHEN 'management-only' THEN
      -- Owner, Manager, Coach
      RETURN v_user_role IN ('owner', 'manager', 'coach');

    WHEN 'captain-only' THEN
      -- Owner, Manager, Coach, Captain
      RETURN v_user_role IN ('owner', 'manager', 'coach', 'captain');

    WHEN 'team-only' THEN
      -- All active team members
      RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = p_user_id
          AND organization_id = p_org_id
          AND is_active = true
      );

    WHEN 'selected-members' THEN
      -- Explicit list or creator
      RETURN p_user_id = ANY(v_allowed_members)
        OR p_user_id = (SELECT created_by FROM calendar_events WHERE id = p_event_id);

    WHEN 'public-workspace' THEN
      -- All org members
      RETURN true;

    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_event_visibility IS 'Check if user can view a specific event based on visibility rules';

-- ============================================================================
-- HELPER: Check calendar visibility for user
-- ============================================================================
CREATE OR REPLACE FUNCTION check_calendar_visibility(
  p_user_id UUID,
  p_calendar_id UUID,
  p_org_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_visibility TEXT;
  v_user_role TEXT;
BEGIN
  v_user_role := get_user_org_role(p_user_id, p_org_id);

  -- Get calendar visibility
  SELECT cc.visibility
  INTO v_visibility
  FROM calendar_configs cc
  WHERE cc.id = p_calendar_id
    AND cc.organization_id = p_org_id
  LIMIT 1;

  -- If calendar not found or deleted, deny access
  IF v_visibility IS NULL THEN
    RETURN false;
  END IF;

  -- Apply visibility rules
  CASE v_visibility
    WHEN 'private' THEN
      -- Only creator
      RETURN p_user_id = (SELECT created_by FROM calendar_configs WHERE id = p_calendar_id);

    WHEN 'management-only' THEN
      -- Owner, Manager, Coach
      RETURN v_user_role IN ('owner', 'manager', 'coach');

    WHEN 'captain-only' THEN
      -- Owner, Manager, Coach, Captain
      RETURN v_user_role IN ('owner', 'manager', 'coach', 'captain');

    WHEN 'team-only' THEN
      -- All active team members
      RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = p_user_id
          AND organization_id = p_org_id
          AND is_active = true
      );

    WHEN 'selected-members' THEN
      -- Check explicit permissions or creator
      RETURN EXISTS (
        SELECT 1 FROM calendar_member_permissions
        WHERE calendar_id = p_calendar_id
          AND member_user_id = p_user_id
          AND deleted_at IS NULL
          AND can_view = true
      )
      OR p_user_id = (SELECT created_by FROM calendar_configs WHERE id = p_calendar_id);

    WHEN 'public-workspace' THEN
      -- All org members
      RETURN true;

    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_calendar_visibility IS 'Check if user can view a specific calendar based on visibility rules';

-- ============================================================================
-- RLS: calendar_configs
-- ============================================================================
DROP POLICY IF EXISTS "calendar_configs_rls_placeholder" ON calendar_configs;

-- SELECT: User can view if visibility allows or if owner/manager/coach/captain of org
CREATE POLICY "calendar_configs_select" ON calendar_configs
FOR SELECT
USING (
  check_calendar_visibility(auth.uid(), id, organization_id)
);

-- INSERT: Only owner/manager/coach/captain can create calendars
CREATE POLICY "calendar_configs_insert" ON calendar_configs
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['owner', 'manager', 'coach', 'captain'])
    OR auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  )
);

-- UPDATE:
-- - Owner: can update any calendar
-- - Manager/Coach: can update calendars in their team
-- - Captain: can update only their own calendars (created_by = auth.uid())
-- - Member: cannot update
CREATE POLICY "calendar_configs_update" ON calendar_configs
FOR UPDATE
USING (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR (is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
      AND check_calendar_visibility(auth.uid(), id, organization_id))
  OR auth.uid() = created_by
)
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR (is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
      AND check_calendar_visibility(auth.uid(), id, organization_id))
  OR auth.uid() = created_by
);

-- DELETE:
-- - Owner: can delete any calendar
-- - Manager/Coach: can delete calendars they can edit
-- - Captain: can delete only their own calendars
-- - Member: cannot delete
CREATE POLICY "calendar_configs_delete" ON calendar_configs
FOR DELETE
USING (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR (is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
      AND check_calendar_visibility(auth.uid(), id, organization_id))
  OR auth.uid() = created_by
);

-- ============================================================================
-- RLS: calendar_visibility_rules
-- ============================================================================
DROP POLICY IF EXISTS "calendar_visibility_rules_rls_placeholder" ON calendar_visibility_rules;

-- SELECT: Organization members can read visibility rules
CREATE POLICY "calendar_visibility_rules_select" ON calendar_visibility_rules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
      AND organization_id = calendar_visibility_rules.organization_id
      AND is_active = true
  )
  OR auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
);

-- INSERT/UPDATE/DELETE: Only owner can manage visibility rules
CREATE POLICY "calendar_visibility_rules_insert" ON calendar_visibility_rules
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
);

CREATE POLICY "calendar_visibility_rules_update" ON calendar_visibility_rules
FOR UPDATE
USING (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
)
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
);

CREATE POLICY "calendar_visibility_rules_delete" ON calendar_visibility_rules
FOR DELETE
USING (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
);

-- ============================================================================
-- RLS: calendar_member_permissions
-- ============================================================================
DROP POLICY IF EXISTS "calendar_member_permissions_rls_placeholder" ON calendar_member_permissions;

-- SELECT: Can view own permissions or manage permissions for calendar
CREATE POLICY "calendar_member_permissions_select" ON calendar_member_permissions
FOR SELECT
USING (
  auth.uid() = member_user_id
  OR auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR (
    -- Manager/Coach can manage permissions for calendars they can edit
    is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
    AND check_calendar_visibility(auth.uid(), calendar_id, organization_id)
  )
  OR (
    -- Calendar creator (captain) can manage permissions for their calendar
    auth.uid() = (SELECT created_by FROM calendar_configs WHERE id = calendar_id)
  )
);

-- INSERT: Only those who can manage calendar can grant permissions
CREATE POLICY "calendar_member_permissions_insert" ON calendar_member_permissions
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR (
    is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
    AND check_calendar_visibility(auth.uid(), calendar_id, organization_id)
  )
  OR auth.uid() = (SELECT created_by FROM calendar_configs WHERE id = calendar_id)
);

-- UPDATE: Same as insert check
CREATE POLICY "calendar_member_permissions_update" ON calendar_member_permissions
FOR UPDATE
USING (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR (
    is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
    AND check_calendar_visibility(auth.uid(), calendar_id, organization_id)
  )
  OR auth.uid() = (SELECT created_by FROM calendar_configs WHERE id = calendar_id)
)
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR (
    is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
    AND check_calendar_visibility(auth.uid(), calendar_id, organization_id)
  )
  OR auth.uid() = (SELECT created_by FROM calendar_configs WHERE id = calendar_id)
);

-- DELETE: Same as insert check
CREATE POLICY "calendar_member_permissions_delete" ON calendar_member_permissions
FOR DELETE
USING (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR (
    is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
    AND check_calendar_visibility(auth.uid(), calendar_id, organization_id)
  )
  OR auth.uid() = (SELECT created_by FROM calendar_configs WHERE id = calendar_id)
);

-- ============================================================================
-- RLS: event_visibility
-- ============================================================================
DROP POLICY IF EXISTS "event_visibility_rls_placeholder" ON event_visibility;

-- SELECT: Can view if user can access the calendar or event
CREATE POLICY "event_visibility_select" ON event_visibility
FOR SELECT
USING (
  check_event_visibility(auth.uid(), event_id, organization_id)
);

-- INSERT: Only owner/manager/coach can create event visibility rules
CREATE POLICY "event_visibility_insert" ON event_visibility
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
  OR auth.uid() = (SELECT created_by FROM calendar_events WHERE id = event_id)
);

-- UPDATE: Only owner/manager/coach/event creator can update
CREATE POLICY "event_visibility_update" ON event_visibility
FOR UPDATE
USING (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
  OR auth.uid() = (SELECT created_by FROM calendar_events WHERE id = event_id)
)
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
  OR auth.uid() = (SELECT created_by FROM calendar_events WHERE id = event_id)
);

-- DELETE: Same as update
CREATE POLICY "event_visibility_delete" ON event_visibility
FOR DELETE
USING (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
  OR auth.uid() = (SELECT created_by FROM calendar_events WHERE id = event_id)
);

-- ============================================================================
-- RLS: calendar_audit_logs
-- ============================================================================
DROP POLICY IF EXISTS "calendar_audit_logs_rls_placeholder" ON calendar_audit_logs;

-- SELECT: Can read logs for calendars/events they can access
CREATE POLICY "calendar_audit_logs_select" ON calendar_audit_logs
FOR SELECT
USING (
  -- Owner can see all logs for org
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  -- Manager/Coach can see logs for calendars they can access
  OR (
    is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
    AND (
      calendar_id IS NULL
      OR check_calendar_visibility(auth.uid(), calendar_id, organization_id)
    )
    AND (
      event_id IS NULL
      OR check_event_visibility(auth.uid(), event_id, organization_id)
    )
  )
);

-- INSERT: Only owner/manager/coach can create audit logs
CREATE POLICY "calendar_audit_logs_insert" ON calendar_audit_logs
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT owner_id FROM organizations WHERE id = organization_id)
  OR is_user_in_team_with_role(auth.uid(), organization_id, ARRAY['manager', 'coach'])
);

-- UPDATE/DELETE: Not allowed (audit trail is immutable)
CREATE POLICY "calendar_audit_logs_no_update" ON calendar_audit_logs
FOR UPDATE
USING (false);

CREATE POLICY "calendar_audit_logs_no_delete" ON calendar_audit_logs
FOR DELETE
USING (false);
