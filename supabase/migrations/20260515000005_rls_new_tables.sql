-- finances
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finances_select_member" ON finances
  FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));

CREATE POLICY "finances_insert_manager" ON finances
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_member_role(organization_id) IN ('manager', 'owner')
  );

CREATE POLICY "finances_update_manager" ON finances
  FOR UPDATE TO authenticated
  USING (public.get_member_role(organization_id) IN ('manager', 'owner'))
  WITH CHECK (public.get_member_role(organization_id) IN ('manager', 'owner'));

CREATE POLICY "finances_delete_manager" ON finances
  FOR DELETE TO authenticated
  USING (public.get_member_role(organization_id) IN ('manager', 'owner'));

-- content_calendar
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_select_member" ON content_calendar
  FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));

CREATE POLICY "content_insert_manager" ON content_calendar
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_member_role(organization_id) IN ('manager', 'owner')
  );

CREATE POLICY "content_update_manager_or_owner" ON content_calendar
  FOR UPDATE TO authenticated
  USING (public.get_member_role(organization_id) IN ('manager', 'owner'))
  WITH CHECK (public.get_member_role(organization_id) IN ('manager', 'owner'));

CREATE POLICY "content_delete_owner_or_own_draft" ON content_calendar
  FOR DELETE TO authenticated
  USING (
    public.get_member_role(organization_id) = 'owner'
    OR (created_by = auth.uid() AND status = 'draft')
  );
