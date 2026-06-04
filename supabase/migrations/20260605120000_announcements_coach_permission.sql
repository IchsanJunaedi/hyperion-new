-- 20260605120000_announcements_coach_permission.sql
-- Fix: coach should be able to create/edit/delete announcements.
-- The original policies used public.is_captain_or_above() which only covers
-- ('owner','captain','manager') — coach was excluded, so a coach hitting the
-- (ungated) "Buat pengumuman" button got a 42501 RLS error. The role model
-- and five-panel design intend coach to manage announcements (same class of
-- bug fixed for polls in 20260604150000).

DROP POLICY IF EXISTS "ann_insert_captain" ON announcements;
CREATE POLICY "ann_insert_captain" ON announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  );

DROP POLICY IF EXISTS "ann_update_captain" ON announcements;
CREATE POLICY "ann_update_captain" ON announcements
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

DROP POLICY IF EXISTS "ann_delete_captain" ON announcements;
CREATE POLICY "ann_delete_captain" ON announcements
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'captain', 'manager', 'coach')
    )
  );
