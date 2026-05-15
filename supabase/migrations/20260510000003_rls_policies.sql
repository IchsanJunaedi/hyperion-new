-- =============================================================================
-- 20260510000003_rls_policies.sql
-- Row-Level Security on every public table. Default-deny: tables have RLS
-- enabled but no permissive policy means no access for `authenticated` /
-- `anon`. Service-role bypasses RLS entirely.
--
-- Important convention used everywhere below:
--   * Member-gated policies are scoped TO authenticated. The helper
--     functions (is_member_of / is_captain_or_above / get_member_role)
--     have EXECUTE granted only to `authenticated` (see migration 02).
--     If those helpers were referenced inside a policy that applied to
--     anon, every anon query would error with "permission denied for
--     function" — so anon access is split into a separate policy that
--     only checks public columns (e.g. organizations.is_public).
-- =============================================================================

-- organizations ----------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Public team-page reads for visitors: only public flag is checked, no helpers.
CREATE POLICY "org_select_public_anon" ON organizations
  FOR SELECT TO anon
  USING (is_public = true);

CREATE POLICY "org_select_public_or_member" ON organizations
  FOR SELECT TO authenticated
  USING (is_public = true OR public.is_member_of(id));

CREATE POLICY "org_insert_self_owner" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_update_owner" ON organizations
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_delete_owner" ON organizations
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- profiles ---------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read any profile (member directory, public team
-- pages). If we ever need stricter visibility we'll add a `is_public` flag.
CREATE POLICY "profile_select_any" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profile_insert_self" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profile_update_self" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- divisions --------------------------------------------------------------------
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "div_select_public_anon" ON divisions
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "div_select" ON divisions
  FOR SELECT TO authenticated
  USING (
    public.is_member_of(organization_id)
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "div_insert" ON divisions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "div_update" ON divisions
  FOR UPDATE TO authenticated
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "div_delete" ON divisions
  FOR DELETE TO authenticated
  USING (public.get_member_role(organization_id) = 'owner');

-- team_members -----------------------------------------------------------------
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tm_select_public_anon" ON team_members
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "tm_select_member_or_public" ON team_members
  FOR SELECT TO authenticated
  USING (
    public.is_member_of(organization_id)
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "tm_insert_captain" ON team_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "tm_update_captain" ON team_members
  FOR UPDATE TO authenticated
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

-- Owner can remove anyone; users can leave the org themselves.
CREATE POLICY "tm_delete_owner_or_self" ON team_members
  FOR DELETE TO authenticated
  USING (
    public.get_member_role(organization_id) = 'owner'
    OR user_id = auth.uid()
  );

-- scrims -----------------------------------------------------------------------
ALTER TABLE scrims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scrims_select" ON scrims
  FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));

CREATE POLICY "scrims_insert" ON scrims
  FOR INSERT TO authenticated
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "scrims_update" ON scrims
  FOR UPDATE TO authenticated
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "scrims_delete" ON scrims
  FOR DELETE TO authenticated
  USING (public.is_captain_or_above(organization_id));

-- scrim_attendances ------------------------------------------------------------
ALTER TABLE scrim_attendances ENABLE ROW LEVEL SECURITY;

-- Any member of the scrim's org can see attendances (real-time roll call).
CREATE POLICY "att_select_member" ON scrim_attendances
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_member_of(s.organization_id)
    )
  );

-- A user can only insert/update/delete their *own* row, AND only on a
-- scrim that belongs to an org they're a member of. Without the
-- membership check, any authenticated user who knows a scrim_id could
-- pollute another team's roll-call list.
CREATE POLICY "att_upsert_self" ON scrim_attendances
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_member_of(s.organization_id)
    )
  );

CREATE POLICY "att_update_self" ON scrim_attendances
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_member_of(s.organization_id)
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_member_of(s.organization_id)
    )
  );

CREATE POLICY "att_delete_self" ON scrim_attendances
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_member_of(s.organization_id)
    )
  );

-- scrim_results ----------------------------------------------------------------
ALTER TABLE scrim_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_select_member" ON scrim_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_member_of(s.organization_id)
    )
  );

CREATE POLICY "sr_upsert_captain" ON scrim_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_captain_or_above(s.organization_id)
    )
  );

CREATE POLICY "sr_update_captain" ON scrim_results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_captain_or_above(s.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_captain_or_above(s.organization_id)
    )
  );

-- tournaments ------------------------------------------------------------------
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tour_select_public_anon" ON tournaments
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "tour_select" ON tournaments
  FOR SELECT TO authenticated
  USING (
    public.is_member_of(organization_id)
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "tour_insert" ON tournaments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "tour_update" ON tournaments
  FOR UPDATE TO authenticated
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "tour_delete" ON tournaments
  FOR DELETE TO authenticated
  USING (public.is_captain_or_above(organization_id));

-- tournament_results -----------------------------------------------------------
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tr_select_public_anon" ON tournament_results
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM tournaments t
      JOIN organizations o ON o.id = t.organization_id
      WHERE t.id = tournament_id AND o.is_public = true
    )
  );

CREATE POLICY "tr_select" ON tournament_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id
        AND (
          public.is_member_of(t.organization_id)
          OR EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = t.organization_id AND o.is_public = true
          )
        )
    )
  );

CREATE POLICY "tr_upsert_captain" ON tournament_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id
        AND public.is_captain_or_above(t.organization_id)
    )
  );

CREATE POLICY "tr_update_captain" ON tournament_results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id
        AND public.is_captain_or_above(t.organization_id)
    )
  );

-- calendar_events --------------------------------------------------------------
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cal_select_member" ON calendar_events
  FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));

CREATE POLICY "cal_insert_member" ON calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of(organization_id));

CREATE POLICY "cal_update_creator_or_captain" ON calendar_events
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

CREATE POLICY "cal_delete_creator_or_captain" ON calendar_events
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

-- announcements ----------------------------------------------------------------
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ann_select_member" ON announcements
  FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));

CREATE POLICY "ann_insert_captain" ON announcements
  FOR INSERT TO authenticated
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "ann_update_captain" ON announcements
  FOR UPDATE TO authenticated
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "ann_delete_captain" ON announcements
  FOR DELETE TO authenticated
  USING (public.is_captain_or_above(organization_id));

-- notifications ----------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- IMPORTANT: there is intentionally NO direct UPDATE policy for `authenticated`
-- on notifications. A blanket UPDATE would let a user reset `status='pending'`,
-- `attempts=0`, and overwrite `wa_number` / `wa_message` on their own row,
-- then watch the service-role process-wa-queue Edge Function deliver an
-- attacker-controlled WhatsApp message via Fonnte. Read-marking goes through
-- public.mark_notification_read(uuid) — see migration 07.

-- INSERTs are still service-role-only (Server Actions / Edge Function), so
-- the bare `authenticated` role has no INSERT/UPDATE on this table at all.

-- strategy_notes ---------------------------------------------------------------
ALTER TABLE strategy_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "strat_select" ON strategy_notes
  FOR SELECT TO authenticated
  USING (
    public.is_member_of(organization_id)
    AND (
      visibility = 'public'
      OR visibility = 'division'
      OR (visibility = 'private' AND created_by = auth.uid())
    )
  );

CREATE POLICY "strat_insert" ON strategy_notes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of(organization_id));

CREATE POLICY "strat_update" ON strategy_notes
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

CREATE POLICY "strat_delete" ON strategy_notes
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

-- files ------------------------------------------------------------------------
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select_member" ON files
  FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));

CREATE POLICY "files_insert_member" ON files
  FOR INSERT TO authenticated
  WITH CHECK (public.is_member_of(organization_id));

CREATE POLICY "files_delete_uploader_or_captain" ON files
  FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

-- achievements -----------------------------------------------------------------
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ach_select_public_anon" ON achievements
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "ach_select" ON achievements
  FOR SELECT TO authenticated
  USING (
    public.is_member_of(organization_id)
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "ach_insert" ON achievements
  FOR INSERT TO authenticated
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "ach_update" ON achievements
  FOR UPDATE TO authenticated
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "ach_delete" ON achievements
  FOR DELETE TO authenticated
  USING (public.is_captain_or_above(organization_id));

-- organization_invites ---------------------------------------------------------
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_select_inviter_or_captain" ON organization_invites
  FOR SELECT TO authenticated
  USING (
    invited_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

CREATE POLICY "inv_insert_captain" ON organization_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "inv_update_captain" ON organization_invites
  FOR UPDATE TO authenticated
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "inv_delete_captain" ON organization_invites
  FOR DELETE TO authenticated
  USING (public.is_captain_or_above(organization_id));

-- Token-based invite acceptance is done via the service-role server action
-- in app/(auth)/invite/[token]/route.ts, so no public SELECT-by-token
-- policy is needed here.
