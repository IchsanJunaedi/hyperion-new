-- 20260616221000_coach_scrim_tournament_permissions.sql
-- Fix: coach should be able to create/edit/delete scrims and tournaments.

-- 1. Scrims Table Policies
DROP POLICY IF EXISTS "scrims_insert" ON scrims;
CREATE POLICY "scrims_insert" ON scrims
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  );

DROP POLICY IF EXISTS "scrims_update" ON scrims;
CREATE POLICY "scrims_update" ON scrims
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  );

DROP POLICY IF EXISTS "scrims_delete" ON scrims;
CREATE POLICY "scrims_delete" ON scrims
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  );


-- 2. Scrim Results Table Policies
DROP POLICY IF EXISTS "sr_upsert_captain" ON scrim_results;
CREATE POLICY "sr_upsert_captain" ON scrim_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND s.organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true
            AND role IN ('owner', 'captain', 'manager', 'coach')
        )
    )
  );

DROP POLICY IF EXISTS "sr_update_captain" ON scrim_results;
CREATE POLICY "sr_update_captain" ON scrim_results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND s.organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true
            AND role IN ('owner', 'captain', 'manager', 'coach')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND s.organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true
            AND role IN ('owner', 'captain', 'manager', 'coach')
        )
    )
  );


-- 3. Tournaments Table Policies
DROP POLICY IF EXISTS "tour_insert" ON tournaments;
CREATE POLICY "tour_insert" ON tournaments
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  );

DROP POLICY IF EXISTS "tour_update" ON tournaments;
CREATE POLICY "tour_update" ON tournaments
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  );

DROP POLICY IF EXISTS "tour_delete" ON tournaments;
CREATE POLICY "tour_delete" ON tournaments
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  );


-- 4. Tournament Results Table Policies
DROP POLICY IF EXISTS "tr_upsert_captain" ON tournament_results;
CREATE POLICY "tr_upsert_captain" ON tournament_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id
        AND t.organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true
            AND role IN ('owner', 'captain', 'manager', 'coach')
        )
    )
  );

DROP POLICY IF EXISTS "tr_update_captain" ON tournament_results;
CREATE POLICY "tr_update_captain" ON tournament_results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id
        AND t.organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true
            AND role IN ('owner', 'captain', 'manager', 'coach')
        )
    )
  );
