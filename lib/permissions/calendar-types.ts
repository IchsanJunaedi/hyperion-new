/**
 * Calendar Permission System Types
 *
 * Comprehensive type definitions for the calendar permission and visibility system.
 * Supports six visibility levels with granular permission control per role.
 */

// ============================================================================
// Visibility Levels
// ============================================================================

/**
 * Calendar visibility levels determining who can access the calendar
 *
 * - private: Only creator (captain/coach/manager)
 * - management-only: Owner, Manager, Coach
 * - captain-only: Owner, Manager, Coach, Captain
 * - team-only: All active team members
 * - selected-members: Explicitly added members
 * - public-workspace: All organization members
 */
export type CalendarVisibility =
  | "private"
  | "management-only"
  | "captain-only"
  | "team-only"
  | "selected-members"
  | "public-workspace";

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Granular permission actions for calendar operations
 */
export type CalendarPermission =
  | "view"
  | "create-event"
  | "edit-event"
  | "delete-event"
  | "manage-permissions"
  | "manage-calendar";

/**
 * User roles in the organization hierarchy
 */
export type UserRole = "owner" | "manager" | "coach" | "captain" | "member";

/**
 * Permission result after evaluation
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  role: UserRole;
  calendarVisibility: CalendarVisibility;
}

// ============================================================================
// Calendar Config Types
// ============================================================================

/**
 * Calendar configuration with visibility and permission settings
 */
export interface CalendarConfig {
  id: string;
  organization_id: string;
  division_id: string | null;
  created_by: string; // user_id of creator (captain/coach/manager)
  title: string;
  description: string | null;
  visibility: CalendarVisibility;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  updated_by: string | null;
}

// ============================================================================
// Visibility Rules Types
// ============================================================================

/**
 * Permission structure for visibility rules
 */
export interface VisibilityPermissions {
  view: UserRole[];
  create: UserRole[];
  edit: UserRole[];
  delete: UserRole[];
  manage_permissions: UserRole[];
}

/**
 * Visibility rule defining permissions for a specific visibility level
 */
export interface CalendarVisibilityRule {
  id: string;
  organization_id: string;
  visibility: CalendarVisibility;
  permissions: VisibilityPermissions;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

// ============================================================================
// Member Permission Types
// ============================================================================

/**
 * Explicit permission grant for a specific member
 * Used when visibility is 'selected-members'
 */
export interface CalendarMemberPermission {
  id: string;
  organization_id: string;
  calendar_id: string;
  member_user_id: string;
  can_view: boolean;
  can_create_event: boolean;
  can_edit_event: boolean;
  can_delete_event: boolean;
  can_manage_permissions: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
  deleted_at: string | null;
}

/**
 * Input type for granting/updating member permissions
 */
export interface GrantMemberPermissionInput {
  calendar_id: string;
  member_user_id: string;
  can_view?: boolean;
  can_create_event?: boolean;
  can_edit_event?: boolean;
  can_delete_event?: boolean;
  can_manage_permissions?: boolean;
}

// ============================================================================
// Event Visibility Types
// ============================================================================

/**
 * Per-event visibility override
 * Allows a specific event to have different visibility than its calendar
 */
export interface EventVisibility {
  id: string;
  organization_id: string;
  event_id: string;
  calendar_id: string | null;
  visibility: CalendarVisibility;
  allowed_member_ids: string[]; // UUIDs of allowed members (if visibility = selected-members)
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

/**
 * Input type for setting event visibility override
 */
export interface SetEventVisibilityInput {
  event_id: string;
  visibility: CalendarVisibility;
  allowed_member_ids?: string[]; // Required if visibility is 'selected-members'
}

// ============================================================================
// Audit Log Types
// ============================================================================

/**
 * Calendar operation action for audit logging
 */
export type CalendarAuditAction =
  | "calendar_created"
  | "calendar_updated"
  | "calendar_deleted"
  | "event_created"
  | "event_updated"
  | "event_deleted"
  | "event_visibility_changed"
  | "permission_granted"
  | "permission_revoked"
  | "permission_updated";

/**
 * Entity type affected by calendar audit action
 */
export type CalendarAuditEntityType = "calendar" | "event" | "permission";

/**
 * Change tracking for audit logs
 */
export interface AuditChanges {
  [key: string]: {
    old_value?: unknown;
    new_value?: unknown;
  };
}

/**
 * Audit log entry for calendar operations
 */
export interface CalendarAuditLog {
  id: string;
  organization_id: string;
  calendar_id: string | null;
  event_id: string | null;
  actor_id: string | null;
  action: CalendarAuditAction;
  entity_type: CalendarAuditEntityType;
  changes: AuditChanges;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Input type for creating audit log entries
 */
export interface CreateAuditLogInput {
  organization_id: string;
  calendar_id?: string | null;
  event_id?: string | null;
  actor_id: string;
  action: CalendarAuditAction;
  entity_type: CalendarAuditEntityType;
  changes?: AuditChanges;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Permission Check Types
// ============================================================================

/**
 * Context for permission evaluation
 */
export interface PermissionCheckContext {
  userId: string;
  userRole: UserRole;
  organizationId: string;
  calendarId?: string;
  eventId?: string;
}

/**
 * Result of permission check with detailed information
 */
export interface DetailedPermissionResult {
  allowed: boolean;
  permission: CalendarPermission;
  role: UserRole;
  visibility: CalendarVisibility;
  reason?: string;
  explicitGrant?: boolean; // True if permission granted via member_permissions table
}

// ============================================================================
// Database Row Types
// ============================================================================

/**
 * Database row type for calendar_configs table
 */
export type CalendarConfigRow = CalendarConfig;

/**
 * Database row type for calendar_visibility_rules table
 */
export type CalendarVisibilityRuleRow = CalendarVisibilityRule;

/**
 * Database row type for calendar_member_permissions table
 */
export type CalendarMemberPermissionRow = CalendarMemberPermission;

/**
 * Database row type for event_visibility table
 */
export type EventVisibilityRow = EventVisibility;

/**
 * Database row type for calendar_audit_logs table
 */
export type CalendarAuditLogRow = CalendarAuditLog;

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Result of querying accessible calendars for a user
 */
export interface AccessibleCalendarResult extends CalendarConfig {
  userPermissions: CalendarMemberPermission | null; // If explicit grant exists
  eventCount?: number;
}

/**
 * Result of querying accessible events for a user
 */
export interface AccessibleEventResult {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  visibility: CalendarVisibility;
  calendar_id?: string;
  userPermissions: DetailedPermissionResult;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Default permission configuration per organization
 */
export interface DefaultPermissionConfig {
  organizationId: string;
  rules: Record<CalendarVisibility, VisibilityPermissions>;
}

/**
 * Permission configuration template
 */
export interface PermissionConfigTemplate {
  name: string;
  description: string;
  rules: Record<CalendarVisibility, VisibilityPermissions>;
}

// Standard templates
export const STANDARD_PERMISSION_TEMPLATES: Record<
  string,
  PermissionConfigTemplate
> = {
  restrictive: {
    name: "Restrictive",
    description: "Management-only access by default",
    rules: {
      private: {
        view: ["owner"],
        create: ["owner"],
        edit: ["owner"],
        delete: ["owner"],
        manage_permissions: ["owner"],
      },
      "management-only": {
        view: ["owner", "manager", "coach"],
        create: ["owner", "manager", "coach"],
        edit: ["owner", "manager", "coach"],
        delete: ["owner", "manager", "coach"],
        manage_permissions: ["owner", "manager"],
      },
      "captain-only": {
        view: ["owner", "manager", "coach", "captain"],
        create: ["owner", "manager", "coach", "captain"],
        edit: ["owner", "manager", "coach", "captain"],
        delete: ["owner", "manager", "coach", "captain"],
        manage_permissions: ["owner", "manager", "coach"],
      },
      "team-only": {
        view: ["owner", "manager", "coach", "captain", "member"],
        create: ["owner", "manager", "coach", "captain"],
        edit: ["owner", "manager", "coach", "captain"],
        delete: ["owner", "manager", "coach", "captain"],
        manage_permissions: ["owner", "manager", "coach"],
      },
      "selected-members": {
        view: ["owner", "manager", "coach"],
        create: ["owner", "manager", "coach"],
        edit: ["owner", "manager", "coach"],
        delete: ["owner", "manager", "coach"],
        manage_permissions: ["owner", "manager"],
      },
      "public-workspace": {
        view: ["owner", "manager", "coach", "captain", "member"],
        create: ["owner", "manager", "coach"],
        edit: ["owner", "manager", "coach"],
        delete: ["owner", "manager", "coach"],
        manage_permissions: ["owner", "manager"],
      },
    },
  },
  collaborative: {
    name: "Collaborative",
    description: "Captain can create and edit events",
    rules: {
      private: {
        view: ["owner", "captain"],
        create: ["owner", "captain"],
        edit: ["owner", "captain"],
        delete: ["owner", "captain"],
        manage_permissions: ["owner"],
      },
      "management-only": {
        view: ["owner", "manager", "coach"],
        create: ["owner", "manager", "coach"],
        edit: ["owner", "manager", "coach"],
        delete: ["owner", "manager", "coach"],
        manage_permissions: ["owner", "manager"],
      },
      "captain-only": {
        view: ["owner", "manager", "coach", "captain"],
        create: ["owner", "manager", "coach", "captain"],
        edit: ["owner", "manager", "coach", "captain"],
        delete: ["owner", "manager", "coach", "captain"],
        manage_permissions: ["owner", "manager", "coach"],
      },
      "team-only": {
        view: ["owner", "manager", "coach", "captain", "member"],
        create: ["owner", "manager", "coach", "captain"],
        edit: ["owner", "manager", "coach", "captain"],
        delete: ["owner", "manager", "coach", "captain"],
        manage_permissions: ["owner", "manager", "coach"],
      },
      "selected-members": {
        view: ["owner", "manager", "coach", "captain"],
        create: ["owner", "manager", "coach", "captain"],
        edit: ["owner", "manager", "coach", "captain"],
        delete: ["owner", "manager", "coach", "captain"],
        manage_permissions: ["owner", "manager"],
      },
      "public-workspace": {
        view: ["owner", "manager", "coach", "captain", "member"],
        create: ["owner", "manager", "coach", "captain"],
        edit: ["owner", "manager", "coach", "captain"],
        delete: ["owner", "manager", "coach", "captain"],
        manage_permissions: ["owner", "manager", "coach"],
      },
    },
  },
  open: {
    name: "Open",
    description: "Team members can create and edit events",
    rules: {
      private: {
        view: ["owner", "captain", "member"],
        create: ["owner", "captain", "member"],
        edit: ["owner", "captain", "member"],
        delete: ["owner", "captain", "member"],
        manage_permissions: ["owner"],
      },
      "management-only": {
        view: ["owner", "manager", "coach"],
        create: ["owner", "manager", "coach"],
        edit: ["owner", "manager", "coach"],
        delete: ["owner", "manager", "coach"],
        manage_permissions: ["owner", "manager"],
      },
      "captain-only": {
        view: ["owner", "manager", "coach", "captain"],
        create: ["owner", "manager", "coach", "captain"],
        edit: ["owner", "manager", "coach", "captain"],
        delete: ["owner", "manager", "coach", "captain"],
        manage_permissions: ["owner", "manager", "coach"],
      },
      "team-only": {
        view: ["owner", "manager", "coach", "captain", "member"],
        create: ["owner", "manager", "coach", "captain", "member"],
        edit: ["owner", "manager", "coach", "captain", "member"],
        delete: ["owner", "manager", "coach", "captain", "member"],
        manage_permissions: ["owner", "manager", "coach"],
      },
      "selected-members": {
        view: ["owner", "manager", "coach", "captain"],
        create: ["owner", "manager", "coach", "captain"],
        edit: ["owner", "manager", "coach", "captain"],
        delete: ["owner", "manager", "coach", "captain"],
        manage_permissions: ["owner", "manager"],
      },
      "public-workspace": {
        view: ["owner", "manager", "coach", "captain", "member"],
        create: ["owner", "manager", "coach", "captain", "member"],
        edit: ["owner", "manager", "coach", "captain", "member"],
        delete: ["owner", "manager", "coach", "captain", "member"],
        manage_permissions: ["owner", "manager", "coach"],
      },
    },
  },
};
