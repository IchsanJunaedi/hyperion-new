-- =============================================================================
-- 20260628170000_rls_open_trials.sql
-- P1: Add RLS policies for open_trials and trial_applicants tables.
-- These tables previously had NO RLS, meaning all queries required admin client.
-- =============================================================================

-- open_trials ----------------------------------------------------------------
ALTER TABLE open_trials ENABLE ROW LEVEL SECURITY;

-- Manager, coach, and owner of the org can read/create/update trials
CREATE POLICY "trials_select_manager_coach" ON open_trials
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = open_trials.org_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager', 'coach', 'owner')
    )
  );

CREATE POLICY "trials_insert_manager_coach" ON open_trials
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = open_trials.org_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager', 'coach', 'owner')
    )
  );

CREATE POLICY "trials_update_manager_coach" ON open_trials
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = open_trials.org_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager', 'coach', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = open_trials.org_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager', 'coach', 'owner')
    )
  );

-- Anon/public can read active trials (for the public trial listing page)
CREATE POLICY "trials_select_public_anon" ON open_trials
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- trial_applicants -----------------------------------------------------------
ALTER TABLE trial_applicants ENABLE ROW LEVEL SECURITY;

-- Manager, coach, and owner can read all applicants for their org's trials
CREATE POLICY "applicants_select_manager_coach" ON trial_applicants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM open_trials ot
      JOIN team_members tm ON tm.organization_id = ot.org_id
      WHERE ot.id = trial_applicants.trial_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager', 'coach', 'owner')
    )
  );

-- The applicant themselves can read their own row (via public token page)
CREATE POLICY "applicants_select_self" ON trial_applicants
  FOR SELECT TO authenticated
  USING (
    -- Self-read is not applicable here since applicants aren't authenticated users.
    -- This policy is a no-op for self-read; public access is handled by anon policy.
    false
  );

-- Anon can insert (public registration form)
CREATE POLICY "applicants_insert_public" ON trial_applicants
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Manager, coach, and owner can update applicants (change status, add notes)
CREATE POLICY "applicants_update_manager_coach" ON trial_applicants
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM open_trials ot
      JOIN team_members tm ON tm.organization_id = ot.org_id
      WHERE ot.id = trial_applicants.trial_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager', 'coach', 'owner')
    )
  );

CREATE POLICY "applicants_delete_manager_coach" ON trial_applicants
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM open_trials ot
      JOIN team_members tm ON tm.organization_id = ot.org_id
      WHERE ot.id = trial_applicants.trial_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager', 'coach', 'owner')
    )
  );
