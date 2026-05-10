-- =============================================================================
-- 20260510000003_rls_policies.sql
-- Row-Level Security on every public table. Default-deny: tables have RLS
-- enabled but no permissive policy means no access for `authenticated` /
-- `anon`. Service-role bypasses RLS entirely.
-- =============================================================================

-- organizations ----------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select_public_or_member" ON organizations
  FOR SELECT
  USING (is_public = true OR public.is_member_of(id));

CREATE POLICY "org_insert_self_owner" ON organizations
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_update_owner" ON organizations
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_delete_owner" ON organizations
  FOR DELETE
  USING (owner_id = auth.uid());

-- profiles ---------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read any profile (member directory, public team
-- pages). If we ever need stricter visibility we'll add a `is_public` flag.
CREATE POLICY "profile_select_any" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profile_insert_self" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profile_update_self" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- divisions --------------------------------------------------------------------
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

-- Public orgs expose their divisions on the public team page; members always
-- see their own org's divisions.
CREATE POLICY "div_select" ON divisions
  FOR SELECT
  USING (
    public.is_member_of(organization_id)
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "div_insert" ON divisions
  FOR INSERT
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "div_update" ON divisions
  FOR UPDATE
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "div_delete" ON divisions
  FOR DELETE
  USING (public.get_member_role(organization_id) = 'owner');

-- team_members -----------------------------------------------------------------
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tm_select_member_or_public" ON team_members
  FOR SELECT
  USING (
    public.is_member_of(organization_id)
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "tm_insert_captain" ON team_members
  FOR INSERT
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "tm_update_captain" ON team_members
  FOR UPDATE
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

-- Owner can remove anyone; users can leave the org themselves.
CREATE POLICY "tm_delete_owner_or_self" ON team_members
  FOR DELETE
  USING (
    public.get_member_role(organization_id) = 'owner'
    OR user_id = auth.uid()
  );

-- scrims -----------------------------------------------------------------------
ALTER TABLE scrims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scrims_select" ON scrims
  FOR SELECT
  USING (public.is_member_of(organization_id));

CREATE POLICY "scrims_insert" ON scrims
  FOR INSERT
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "scrims_update" ON scrims
  FOR UPDATE
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "scrims_delete" ON scrims
  FOR DELETE
  USING (public.is_captain_or_above(organization_id));

-- scrim_attendances ------------------------------------------------------------
ALTER TABLE scrim_attendances ENABLE ROW LEVEL SECURITY;

-- Any member of the scrim's org can see attendances (real-time roll call).
CREATE POLICY "att_select_member" ON scrim_attendances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_member_of(s.organization_id)
    )
  );

-- A user can only insert/update/delete their own row.
CREATE POLICY "att_upsert_self" ON scrim_attendances
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "att_update_self" ON scrim_attendances
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "att_delete_self" ON scrim_attendances
  FOR DELETE
  USING (user_id = auth.uid());

-- scrim_results ----------------------------------------------------------------
ALTER TABLE scrim_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_select_member" ON scrim_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_member_of(s.organization_id)
    )
  );

CREATE POLICY "sr_upsert_captain" ON scrim_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scrims s
      WHERE s.id = scrim_id
        AND public.is_captain_or_above(s.organization_id)
    )
  );

CREATE POLICY "sr_update_captain" ON scrim_results
  FOR UPDATE
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

CREATE POLICY "tour_select" ON tournaments
  FOR SELECT
  USING (
    public.is_member_of(organization_id)
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "tour_insert" ON tournaments
  FOR INSERT
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "tour_update" ON tournaments
  FOR UPDATE
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "tour_delete" ON tournaments
  FOR DELETE
  USING (public.is_captain_or_above(organization_id));

-- tournament_results -----------------------------------------------------------
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tr_select" ON tournament_results
  FOR SELECT
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
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id
        AND public.is_captain_or_above(t.organization_id)
    )
  );

CREATE POLICY "tr_update_captain" ON tournament_results
  FOR UPDATE
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
  FOR SELECT
  USING (public.is_member_of(organization_id));

CREATE POLICY "cal_insert_member" ON calendar_events
  FOR INSERT
  WITH CHECK (public.is_member_of(organization_id));

CREATE POLICY "cal_update_creator_or_captain" ON calendar_events
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

CREATE POLICY "cal_delete_creator_or_captain" ON calendar_events
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

-- announcements ----------------------------------------------------------------
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ann_select_member" ON announcements
  FOR SELECT
  USING (public.is_member_of(organization_id));

CREATE POLICY "ann_insert_captain" ON announcements
  FOR INSERT
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "ann_update_captain" ON announcements
  FOR UPDATE
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "ann_delete_captain" ON announcements
  FOR DELETE
  USING (public.is_captain_or_above(organization_id));

-- notifications ----------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select_own" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notif_update_own" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERTs are done via service-role (Server Actions / Edge Function), so no
-- INSERT policy for `authenticated`. RLS prevents direct client inserts.

-- strategy_notes ---------------------------------------------------------------
ALTER TABLE strategy_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "strat_select" ON strategy_notes
  FOR SELECT
  USING (
    public.is_member_of(organization_id)
    AND (
      visibility = 'public'
      OR visibility = 'division'
      OR (visibility = 'private' AND created_by = auth.uid())
    )
  );

CREATE POLICY "strat_insert" ON strategy_notes
  FOR INSERT
  WITH CHECK (public.is_member_of(organization_id));

CREATE POLICY "strat_update" ON strategy_notes
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

CREATE POLICY "strat_delete" ON strategy_notes
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

-- files ------------------------------------------------------------------------
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select_member" ON files
  FOR SELECT
  USING (public.is_member_of(organization_id));

CREATE POLICY "files_insert_member" ON files
  FOR INSERT
  WITH CHECK (public.is_member_of(organization_id));

CREATE POLICY "files_delete_uploader_or_captain" ON files
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

-- achievements -----------------------------------------------------------------
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ach_select" ON achievements
  FOR SELECT
  USING (
    public.is_member_of(organization_id)
    OR EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_id AND o.is_public = true
    )
  );

CREATE POLICY "ach_insert" ON achievements
  FOR INSERT
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "ach_update" ON achievements
  FOR UPDATE
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "ach_delete" ON achievements
  FOR DELETE
  USING (public.is_captain_or_above(organization_id));

-- organization_invites ---------------------------------------------------------
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_select_inviter_or_captain" ON organization_invites
  FOR SELECT
  USING (
    invited_by = auth.uid()
    OR public.is_captain_or_above(organization_id)
  );

CREATE POLICY "inv_insert_captain" ON organization_invites
  FOR INSERT
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "inv_update_captain" ON organization_invites
  FOR UPDATE
  USING (public.is_captain_or_above(organization_id))
  WITH CHECK (public.is_captain_or_above(organization_id));

CREATE POLICY "inv_delete_captain" ON organization_invites
  FOR DELETE
  USING (public.is_captain_or_above(organization_id));

-- Token-based invite acceptance is done via the service-role server action
-- in app/(auth)/invite/[token]/route.ts, so no public SELECT-by-token
-- policy is needed here.
