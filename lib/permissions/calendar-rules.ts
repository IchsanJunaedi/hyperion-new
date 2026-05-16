/**
 * Calendar Permission Decision Logic
 *
 * Implements the permission decision matrix for calendar operations.
 * Determines what actions a user can perform based on:
 * - User role (owner/manager/coach/captain/member)
 * - Calendar visibility level (private/management-only/captain-only/team-only/selected-members/public-workspace)
 * - Explicit member permissions (for selected-members calendars)
 * - Creator status (for private/selected-member calendars)
 */

import type {
  UserRole,
  CalendarVisibility,
  CalendarPermission,
  CalendarMemberPermission,
} from "@/lib/permissions/calendar-types";

// ============================================================================
// Permission Decision Matrix
// ============================================================================

/**
 * Comprehensive permission matrix defining what actions each role can perform
 * per visibility level
 *
 * Format: [userRole][visibility][permission] = boolean
 */
const PERMISSION_MATRIX: Record<
  UserRole,
  Record<CalendarVisibility, Record<CalendarPermission, boolean>>
> = {
  // Owner: Full access to everything
  owner: {
    private: {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "management-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "captain-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "team-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "selected-members": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "public-workspace": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
  },

  // Manager: Management operations on team calendars
  manager: {
    private: {
      "view": false,
      "create-event": false,
      "edit-event": false,
      "delete-event": false,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "management-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "captain-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "team-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "selected-members": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "public-workspace": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
  },

  // Coach: View and create operations on team calendars
  coach: {
    private: {
      "view": false,
      "create-event": false,
      "edit-event": false,
      "delete-event": false,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "management-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "captain-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "team-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "selected-members": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": false,
    },
    "public-workspace": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": false,
      "manage-calendar": false,
    },
  },

  // Captain: View and limited management of own calendars
  captain: {
    private: {
      "view": true, // Only if creator
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": true,
    },
    "management-only": {
      "view": true,
      "create-event": false,
      "edit-event": false,
      "delete-event": false,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "captain-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "team-only": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "selected-members": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": true,
      "manage-calendar": false,
    },
    "public-workspace": {
      "view": true,
      "create-event": true,
      "edit-event": true,
      "delete-event": true,
      "manage-permissions": false,
      "manage-calendar": false,
    },
  },

  // Member: View-only access based on visibility
  member: {
    private: {
      "view": false,
      "create-event": false,
      "edit-event": false,
      "delete-event": false,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "management-only": {
      "view": false,
      "create-event": false,
      "edit-event": false,
      "delete-event": false,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "captain-only": {
      "view": false,
      "create-event": false,
      "edit-event": false,
      "delete-event": false,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "team-only": {
      "view": true,
      "create-event": false,
      "edit-event": false,
      "delete-event": false,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "selected-members": {
      "view": false, // Must check explicit permissions
      "create-event": false,
      "edit-event": false,
      "delete-event": false,
      "manage-permissions": false,
      "manage-calendar": false,
    },
    "public-workspace": {
      "view": true,
      "create-event": false,
      "edit-event": false,
      "delete-event": false,
      "manage-permissions": false,
      "manage-calendar": false,
    },
  },
};

// ============================================================================
// Core Decision Functions
// ============================================================================

/**
 * Determine all permissions granted to a user for a specific calendar
 * Combines role-based permissions with explicit grants
 *
 * @param userRole - User's role in organization
 * @param visibility - Calendar's visibility level
 * @param explicitPermission - Explicit permission grant for selected-members
 * @param isCreator - Whether user is the calendar creator
 * @returns Set of permissions the user has
 */
export function resolvePermissions(
  userRole: UserRole | null,
  visibility: CalendarVisibility,
  explicitPermission?: CalendarMemberPermission,
  isCreator: boolean = false,
): Set<CalendarPermission> {
  const permissions = new Set<CalendarPermission>();

  if (!userRole) {
    return permissions;
  }

  // Get base permissions from matrix
  const basePerms = PERMISSION_MATRIX[userRole]?.[visibility];

  if (!basePerms) {
    return permissions;
  }

  // Add all true permissions
  for (const [perm, allowed] of Object.entries(basePerms)) {
    if (allowed) {
      permissions.add(perm as CalendarPermission);
    }
  }

  // Creator overrides: creator always has full access to their own calendars
  if (isCreator && !["public-workspace", "team-only"].includes(visibility)) {
    if (visibility === "private" || visibility === "selected-members") {
      permissions.add("view");
      permissions.add("create-event");
      permissions.add("edit-event");
      permissions.add("delete-event");
      permissions.add("manage-permissions");
      permissions.add("manage-calendar");
    }
  }

  // Explicit permissions override (for selected-members)
  if (visibility === "selected-members" && explicitPermission) {
    if (explicitPermission.can_view) permissions.add("view");
    else permissions.delete("view");

    if (explicitPermission.can_create_event) permissions.add("create-event");
    else permissions.delete("create-event");

    if (explicitPermission.can_edit_event) permissions.add("edit-event");
    else permissions.delete("edit-event");

    if (explicitPermission.can_delete_event) permissions.add("delete-event");
    else permissions.delete("delete-event");

    if (explicitPermission.can_manage_permissions) permissions.add("manage-permissions");
    else permissions.delete("manage-permissions");
  }

  return permissions;
}

/**
 * Check if a specific permission is in the granted set
 *
 * @param permissions - Set of granted permissions
 * @param permission - Permission to check
 * @returns true if permission is granted
 */
export function hasPermission(
  permissions: Set<CalendarPermission>,
  permission: CalendarPermission,
): boolean {
  return permissions.has(permission);
}

/**
 * Check if a user role is equal to or higher than required role
 * Used for hierarchical permission checks
 *
 * @param userRole - User's role
 * @param requiredRole - Minimum required role
 * @returns true if user role >= required role
 */
export function isRoleHigherOrEqual(
  userRole: UserRole | null,
  requiredRole: UserRole,
): boolean {
  if (!userRole) return false;

  const roleHierarchy: Record<UserRole, number> = {
    owner: 5,
    manager: 4,
    coach: 3,
    captain: 2,
    member: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get human-readable description of visibility level
 *
 * @param visibility - Calendar visibility level
 * @returns Description text
 */
export function getVisibilityDescription(visibility: CalendarVisibility): string {
  const descriptions: Record<CalendarVisibility, string> = {
    private: "Only you can see this calendar",
    "management-only": "Owner, managers, and coaches can see this calendar",
    "captain-only": "Captains, managers, coaches, and owner can see this calendar",
    "team-only": "All team members can see this calendar",
    "selected-members": "Only selected members can see this calendar",
    "public-workspace": "Everyone in the workspace can see this calendar",
  };

  return descriptions[visibility];
}

/**
 * Get what actions are allowed for a visibility level by role
 * Used for UI hints and information
 *
 * @param userRole - User's role
 * @param visibility - Calendar visibility level
 * @returns Array of allowed actions
 */
export function getAllowedActionsForRole(
  userRole: UserRole | null,
  visibility: CalendarVisibility,
): CalendarPermission[] {
  if (!userRole) return [];

  const perms = PERMISSION_MATRIX[userRole]?.[visibility];
  if (!perms) return [];

  return (Object.entries(perms) as Array<[CalendarPermission, boolean]>)
    .filter(([, allowed]) => allowed)
    .map(([perm]) => perm);
}

// ============================================================================
// Permission Check Helper Functions
// ============================================================================

/**
 * Check if user can perform a specific action on a calendar
 *
 * @param permissions - User's resolved permissions
 * @param action - Action to check
 * @returns true if action is allowed
 */
export function canPerformAction(
  permissions: Set<CalendarPermission>,
  action: CalendarPermission,
): boolean {
  return permissions.has(action);
}

/**
 * Check if user can view calendar based on permissions
 *
 * @param permissions - User's resolved permissions
 * @returns true if user can view
 */
export function canViewCalendar(permissions: Set<CalendarPermission>): boolean {
  return permissions.has("view");
}

/**
 * Check if user can create events in calendar
 *
 * @param permissions - User's resolved permissions
 * @returns true if user can create events
 */
export function canCreateEvents(permissions: Set<CalendarPermission>): boolean {
  return permissions.has("create-event");
}

/**
 * Check if user can edit events in calendar
 *
 * @param permissions - User's resolved permissions
 * @returns true if user can edit events
 */
export function canEditEvents(permissions: Set<CalendarPermission>): boolean {
  return permissions.has("edit-event");
}

/**
 * Check if user can delete events in calendar
 *
 * @param permissions - User's resolved permissions
 * @returns true if user can delete events
 */
export function canDeleteEvents(permissions: Set<CalendarPermission>): boolean {
  return permissions.has("delete-event");
}

/**
 * Check if user can manage calendar itself
 *
 * @param permissions - User's resolved permissions
 * @returns true if user can manage calendar
 */
export function canManageCalendar(permissions: Set<CalendarPermission>): boolean {
  return permissions.has("manage-calendar");
}

/**
 * Check if user can manage permissions for calendar
 *
 * @param permissions - User's resolved permissions
 * @returns true if user can manage permissions
 */
export function canManagePermissions(permissions: Set<CalendarPermission>): boolean {
  return permissions.has("manage-permissions");
}

// ============================================================================
// Visibility Level Analysis
// ============================================================================

/**
 * Determine which roles can see a calendar at a given visibility level
 *
 * @param visibility - Calendar visibility level
 * @returns Array of roles that can view
 */
export function getViewableByRoles(visibility: CalendarVisibility): UserRole[] {
  const roles: UserRole[] = [];

  for (const role of ["owner", "manager", "coach", "captain", "member"] as UserRole[]) {
    if (PERMISSION_MATRIX[role][visibility]["view"]) {
      roles.push(role);
    }
  }

  return roles;
}

/**
 * Determine which roles can create events at a visibility level
 *
 * @param visibility - Calendar visibility level
 * @returns Array of roles that can create events
 */
export function getCreationAllowedByRoles(visibility: CalendarVisibility): UserRole[] {
  const roles: UserRole[] = [];

  for (const role of ["owner", "manager", "coach", "captain", "member"] as UserRole[]) {
    if (PERMISSION_MATRIX[role][visibility]["create-event"]) {
      roles.push(role);
    }
  }

  return roles;
}

// ============================================================================
// Permission Template Analysis
// ============================================================================

/**
 * Analyze permission requirements for a specific action
 * Used for UI guidance and error messages
 *
 * @param action - The action to analyze
 * @returns Requirements and recommendations
 */
export function analyzeActionRequirements(action: CalendarPermission): {
  minimumRole: UserRole;
  visibilityRecommendations: CalendarVisibility[];
  restrictedVisibilities: CalendarVisibility[];
} {
  const visibilityRecommendations: CalendarVisibility[] = [];
  const restrictedVisibilities: CalendarVisibility[] = [];
  let minimumRole: UserRole = "member";

  for (const visibility of [
    "private",
    "management-only",
    "captain-only",
    "team-only",
    "selected-members",
    "public-workspace",
  ] as CalendarVisibility[]) {
    let roleFound = false;

    for (const role of ["owner", "manager", "coach", "captain", "member"] as UserRole[]) {
      if (PERMISSION_MATRIX[role][visibility][action]) {
        if (!roleFound) {
          minimumRole = role;
          roleFound = true;
        }
      }
    }

    if (roleFound) {
      visibilityRecommendations.push(visibility);
    } else {
      restrictedVisibilities.push(visibility);
    }
  }

  return {
    minimumRole,
    visibilityRecommendations,
    restrictedVisibilities,
  };
}
