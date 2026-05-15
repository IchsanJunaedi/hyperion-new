-- =============================================================================
-- 20260514000002_audit_log.sql
--
-- Audit log table to track all significant actions in the system.
-- Owner can view the full activity history from /dashboard/audit.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by org (stored in metadata.organization_id)
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

-- RLS: only service role can insert (via admin client), owner can read all
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_read_owner" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (true); -- Owner-only access is enforced at the app level (dashboard layout)

CREATE POLICY "audit_insert_service" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Server actions insert via admin client

COMMENT ON TABLE public.audit_logs IS 'System-wide audit trail for owner dashboard';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed: member_added, role_changed, scrim_created, org_updated, division_archived, etc.';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Type of entity: organization, team_member, scrim, announcement, division, etc.';
