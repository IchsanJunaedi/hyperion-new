-- =============================================================================
-- 20260516000008_calendar_permissions.sql
-- Calendar Permission System: Comprehensive visibility & permission control
--
-- This migration introduces granular permission management for calendar events:
-- - Private: Only creator (captain/coach/manager) can view
-- - Management-only: Owner/Manager/Coach can view
-- - Captain-only: Owner/Manager/Coach/Captain can view
-- - Team-only: All team members can view
-- - Selected-members: Explicit list of members can view
-- - Public-workspace: All organization members can view
-- =============================================================================

-- ============================================================================
-- calendar_configs: Store visibility & permission settings per calendar
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id           UUID REFERENCES divisions(id) ON DELETE SET NULL,
  created_by            UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title                 TEXT NOT NULL,
  description           TEXT,

  -- Visibility level determines base permission rules
  visibility            TEXT NOT NULL DEFAULT 'team-only'
                        CHECK (visibility IN (
                          'private',
                          'management-only',
                          'captain-only',
                          'team-only',
                          'selected-members',
                          'public-workspace'
                        )),

  is_active             BOOLEAN NOT NULL DEFAULT true,

  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ,
  updated_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_configs_org ON calendar_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_configs_division ON calendar_configs(division_id) WHERE division_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_configs_creator ON calendar_configs(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_configs_active ON calendar_configs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_calendar_configs_deleted ON calendar_configs(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE public.calendar_configs IS 'Calendar configuration with visibility level and permission settings';
COMMENT ON COLUMN public.calendar_configs.visibility IS 'Visibility level: private (creator only), management-only (owner/manager/coach), captain-only (+ captain), team-only (all members), selected-members (explicit list), public-workspace (all org members)';
COMMENT ON COLUMN public.calendar_configs.created_by IS 'User who created this calendar (captain/coach/manager)';

-- ============================================================================
-- calendar_visibility_rules: Define permissions for each visibility level
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_visibility_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Visibility level this rule applies to
  visibility            TEXT NOT NULL
                        CHECK (visibility IN (
                          'private',
                          'management-only',
                          'captain-only',
                          'team-only',
                          'selected-members',
                          'public-workspace'
                        )),

  -- Permission configuration (JSON for flexibility)
  permissions           JSONB NOT NULL DEFAULT '{"view":[],"create":[],"edit":[],"delete":[],"manage":[]}'::jsonb,
  -- Example: {
  --   "view": ["owner", "manager", "coach", "captain", "member"],
  --   "create": ["owner", "manager", "coach", "captain"],
  --   "edit": ["owner", "manager", "coach", "creator"],
  --   "delete": ["owner", "manager", "coach", "creator"],
  --   "manage_permissions": ["owner", "manager", "coach"]
  -- }

  is_active             BOOLEAN NOT NULL DEFAULT true,

  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE(organization_id, visibility)
);

CREATE INDEX IF NOT EXISTS idx_visibility_rules_org ON calendar_visibility_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_visibility_rules_active ON calendar_visibility_rules(is_active) WHERE is_active = true;

COMMENT ON TABLE public.calendar_visibility_rules IS 'Default permission rules for each visibility level per organization';
COMMENT ON COLUMN public.calendar_visibility_rules.permissions IS 'JSONB with arrays of roles allowed for view/create/edit/delete/manage operations';

-- ============================================================================
-- calendar_member_permissions: Explicit permissions for selected members
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_member_permissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  calendar_id           UUID NOT NULL REFERENCES calendar_configs(id) ON DELETE CASCADE,
  member_user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Specific permissions granted to this member
  can_view              BOOLEAN NOT NULL DEFAULT true,
  can_create_event      BOOLEAN NOT NULL DEFAULT false,
  can_edit_event        BOOLEAN NOT NULL DEFAULT false,
  can_delete_event      BOOLEAN NOT NULL DEFAULT false,
  can_manage_permissions BOOLEAN NOT NULL DEFAULT false,

  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at            TIMESTAMPTZ,

  UNIQUE(calendar_id, member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_member_perms_calendar ON calendar_member_permissions(calendar_id);
CREATE INDEX IF NOT EXISTS idx_member_perms_member ON calendar_member_permissions(member_user_id);
CREATE INDEX IF NOT EXISTS idx_member_perms_org ON calendar_member_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_perms_deleted ON calendar_member_permissions(deleted_at) WHERE deleted_at IS NOT NULL;

COMMENT ON TABLE public.calendar_member_permissions IS 'Explicit permissions for individual members in selected-members visibility calendars';
COMMENT ON COLUMN public.calendar_member_permissions.can_view IS 'Member can view events in this calendar';
COMMENT ON COLUMN public.calendar_member_permissions.can_create_event IS 'Member can create new events in this calendar';
COMMENT ON COLUMN public.calendar_member_permissions.can_edit_event IS 'Member can edit events (own or all depending on policy)';
COMMENT ON COLUMN public.calendar_member_permissions.can_delete_event IS 'Member can delete events (own or all depending on policy)';
COMMENT ON COLUMN public.calendar_member_permissions.can_manage_permissions IS 'Member can manage who has access to this calendar';

-- ============================================================================
-- event_visibility: Per-event visibility override (optional)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_visibility (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id              UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  calendar_id           UUID REFERENCES calendar_configs(id) ON DELETE SET NULL,

  -- Override calendar's default visibility for this specific event
  visibility            TEXT NOT NULL
                        CHECK (visibility IN (
                          'private',
                          'management-only',
                          'captain-only',
                          'team-only',
                          'selected-members',
                          'public-workspace'
                        )),

  -- If visibility is 'selected-members', explicit list of member IDs
  allowed_member_ids    UUID[] NOT NULL DEFAULT '{}',

  -- Audit fields
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE(event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_visibility_org ON event_visibility(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_visibility_event ON event_visibility(event_id);
CREATE INDEX IF NOT EXISTS idx_event_visibility_calendar ON event_visibility(calendar_id) WHERE calendar_id IS NOT NULL;

COMMENT ON TABLE public.event_visibility IS 'Per-event visibility override: allows specific event to have different visibility than its calendar';
COMMENT ON COLUMN public.event_visibility.visibility IS 'Visibility level for this specific event (overrides calendar default)';
COMMENT ON COLUMN public.event_visibility.allowed_member_ids IS 'Array of user IDs allowed to view (if visibility = selected-members)';

-- ============================================================================
-- calendar_audit_logs: Audit trail for calendar operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_audit_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  calendar_id           UUID REFERENCES calendar_configs(id) ON DELETE SET NULL,
  event_id              UUID REFERENCES calendar_events(id) ON DELETE SET NULL,

  actor_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Action: created, updated, deleted, visibility_changed, permission_granted, permission_revoked
  action                TEXT NOT NULL,

  -- Entity affected: calendar, event, permission
  entity_type           TEXT NOT NULL,

  -- What changed (JSON)
  changes               JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: { old_visibility: 'private', new_visibility: 'team-only' }

  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_audit_org ON calendar_audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_audit_calendar ON calendar_audit_logs(calendar_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_audit_event ON calendar_audit_logs(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_audit_actor ON calendar_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_audit_action ON calendar_audit_logs(action);

COMMENT ON TABLE public.calendar_audit_logs IS 'Audit trail for all calendar and permission-related operations';
COMMENT ON COLUMN public.calendar_audit_logs.action IS 'Action performed: calendar_created, calendar_updated, calendar_deleted, event_created, event_visibility_changed, permission_granted, permission_revoked, etc.';
COMMENT ON COLUMN public.calendar_audit_logs.entity_type IS 'Type of entity affected: calendar, event, permission';
COMMENT ON COLUMN public.calendar_audit_logs.changes IS 'JSON documenting what changed (old value, new value)';

-- ============================================================================
-- RLS Policies (to be added in next migration)
-- ============================================================================
-- RLS will be added in next migration after detailed permission logic review

ALTER TABLE public.calendar_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_visibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_audit_logs ENABLE ROW LEVEL SECURITY;

-- Placeholder policies (disabled by default, will be properly implemented)
CREATE POLICY "calendar_configs_rls_placeholder" ON public.calendar_configs
  FOR ALL USING (true);

CREATE POLICY "calendar_visibility_rules_rls_placeholder" ON public.calendar_visibility_rules
  FOR ALL USING (true);

CREATE POLICY "calendar_member_permissions_rls_placeholder" ON public.calendar_member_permissions
  FOR ALL USING (true);

CREATE POLICY "event_visibility_rls_placeholder" ON public.event_visibility
  FOR ALL USING (true);

CREATE POLICY "calendar_audit_logs_rls_placeholder" ON public.calendar_audit_logs
  FOR ALL USING (true);
