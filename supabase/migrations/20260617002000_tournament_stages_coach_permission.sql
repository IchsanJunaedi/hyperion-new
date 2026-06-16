-- 20260617002000_tournament_stages_coach_permission.sql
-- Fix RLS: Allow coaches to manage tournament stages, matching the tournament permissions.

DROP POLICY IF EXISTS "Captain+ can manage tournament stages" ON tournament_stages;
CREATE POLICY "Captain+ can manage tournament stages" ON tournament_stages
  FOR ALL TO authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE organization_id IN (
        SELECT organization_id FROM team_members
        WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'captain', 'manager', 'coach')
      )
    )
  )
  WITH CHECK (
    tournament_id IN (
      SELECT id FROM tournaments WHERE organization_id IN (
        SELECT organization_id FROM team_members
        WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'captain', 'manager', 'coach')
      )
    )
  );
