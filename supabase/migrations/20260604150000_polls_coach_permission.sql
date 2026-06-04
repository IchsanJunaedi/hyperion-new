-- 20260604150000_polls_coach_permission.sql
-- Fix: coach should be able to create polls (was missing from RLS policy and UI)

DROP POLICY IF EXISTS "Captain+ can create polls" ON polls;

CREATE POLICY "Captain+ can create polls"
  ON polls FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('captain', 'coach', 'manager', 'owner')
    )
  );
