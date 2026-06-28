-- =============================================================================
-- 20260628160000_profile_rls_restrict.sql
-- C1: Restrict profile reads to prevent PII leakage (phone_wa, game_ids, bio).
--
-- Previously: profile_select_any allowed ALL authenticated users to read ALL
-- profiles (including phone numbers of users from other orgs).
--
-- New policies:
--   1. Self: user can always read own profile
--   2. Same-org: user can read profiles of members in any org they belong to
--   3. Public org: any authenticated user can read profiles of members in
--      public organizations (for public team pages)
--   4. Anon public: unauthenticated visitors can read profiles in public orgs
--      (for public team pages like /divisions/[slug])
-- =============================================================================

-- Remove the overly permissive policy
DROP POLICY IF EXISTS "profile_select_any" ON profiles;

-- 1. Self: user always sees own profile
CREATE POLICY "profile_select_self" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 2. Same-org: user sees profiles of members in any org they belong to.
--    Uses a correlated subquery: finds the profile's user in team_members,
--    then checks if the current user is also a member of that same org.
--    This enables workspace features (roster display, attendance, etc.).
CREATE POLICY "profile_select_org_member" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm_target
      WHERE tm_target.user_id = profiles.id
        AND tm_target.is_active = true
        AND EXISTS (
          SELECT 1 FROM team_members tm_caller
          WHERE tm_caller.user_id = auth.uid()
            AND tm_caller.organization_id = tm_target.organization_id
            AND tm_caller.is_active = true
        )
    )
  );

-- 3. Public org: any authenticated user can see profiles of members in public
--    organizations. Enables public team pages like /divisions/[slug].
CREATE POLICY "profile_select_public" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN organizations o ON o.id = tm.organization_id
      WHERE tm.user_id = profiles.id
        AND tm.is_active = true
        AND o.is_public = true
    )
  );

-- 4. Anon public: unauthenticated visitors can read profiles of members in
--    public organizations. Enables public pages without requiring login.
CREATE POLICY "profile_select_public_anon" ON profiles
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN organizations o ON o.id = tm.organization_id
      WHERE tm.user_id = profiles.id
        AND tm.is_active = true
        AND o.is_public = true
    )
  );
