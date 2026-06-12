/**
 * Calendar Access Permission System
 *
 * Core permission checking functions for the calendar system.
 * Uses server-side Supabase client for secure permission verification.
 *
 * All functions enforce RLS and check:
 * - User role in organization
 * - Calendar/event visibility settings
 * - Explicit member permissions
 * - Creator status (for private/selected-member calendars)
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import type {
  UserRole,
  CalendarVisibility,
  CalendarConfig,
  CalendarMemberPermission,
  EventVisibility,
  CalendarPermission,
} from "@/lib/permissions/calendar-types";

// ============================================================================
// Core Permission Check Types
// ============================================================================

export interface PermissionCheckOptions {
  // If true, return detailed reason for denial
  verbose?: boolean;
  // Force check even for deleted entities
  includeDeleted?: boolean;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  role: UserRole | null;
  visibility?: CalendarVisibility;
}

export interface AccessibleCalendarResult extends CalendarConfig {
  userPermissions: CalendarMemberPermission | null;
  eventCount?: number;
}

export interface AccessibleEventResult {
  id: string;
  title: string;
  event_type?: string;
  starts_at: string;
  ends_at: string | null;
  visibility: CalendarVisibility;
  calendar_id?: string;
  created_by: string;
}

// ============================================================================
// 1. Get User's Role in Organization
// ============================================================================

/**
 * Determine user's role in the organization
 * - Checks OWNER_EMAIL env var first (owner detection)
 * - Then checks team_members table for manager/coach/captain/member role
 *
 * @param userId - User's UUID
 * @param organizationId - Organization's UUID
 * @returns User's role: 'owner' | 'manager' | 'coach' | 'captain' | 'member' | null
 */
export async function getUserRoleInOrg(
  userId: string,
  organizationId: string,
): Promise<UserRole | null> {
  try {
    const client = await createClient();

    // 1. Check if user is owner via OWNER_EMAIL
    const { data: user } = await client.auth.getUser();
    const ownerEmail = process.env.OWNER_EMAIL;

    if (user?.user?.email === ownerEmail) {
      return "owner";
    }

    // 2. Check team_members table for role
    const { data: teamMember, error } = await client
      .from("team_members")
      .select("role")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        // No row found - user is not in this org
        return null;
      }
      throw error;
    }

    return (teamMember?.role as UserRole) || null;
  } catch (err) {
    console.error("Error getting user role:", err);
    return null;
  }
}

// ============================================================================
// 2. Check Calendar Visibility
// ============================================================================

/**
 * Check if user can view a specific calendar
 * Respects visibility rules and explicit permissions
 *
 * @param userId - User's UUID
 * @param calendarId - Calendar's UUID
 * @param organizationId - Organization's UUID
 * @param options - Additional check options
 * @returns Permission check result
 */
export async function checkCalendarVisibility(
  userId: string,
  calendarId: string,
  organizationId: string,
  options: PermissionCheckOptions = {},
): Promise<PermissionCheckResult> {
  try {
    const client = await createClient();

    // Get user's role
    const userRole = await getUserRoleInOrg(userId, organizationId);

    // Get calendar with visibility
    const { data: calendar, error } = await client
      .from("calendar_configs")
      .select("id, visibility, created_by, deleted_at")
      .eq("id", calendarId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error || !calendar) {
      return {
        allowed: false,
        reason: "Calendar not found",
        role: userRole,
      };
    }

    if (calendar.deleted_at && !options.includeDeleted) {
      return {
        allowed: false,
        reason: "Calendar has been deleted",
        role: userRole,
      };
    }

    // Check visibility rules
    const visibility = calendar.visibility as CalendarVisibility;

    switch (visibility) {
      case "private":
        // Only creator
        return {
          allowed: userId === calendar.created_by,
          reason:
            userId !== calendar.created_by ? "Private calendar - creator only" : undefined,
          role: userRole,
          visibility,
        };

      case "management-only":
        // Owner, Manager, Coach
        return {
          allowed: !!(userRole && ["owner", "manager", "coach"].includes(userRole)),
          reason:
            !userRole || !["owner", "manager", "coach"].includes(userRole)
              ? "Management-only calendar - requires manager or coach role"
              : undefined,
          role: userRole,
          visibility,
        };

      case "captain-only":
        // Owner, Manager, Coach, Captain
        return {
          allowed: !!(userRole && ["owner", "manager", "coach", "captain"].includes(userRole)),
          reason:
            !userRole || !["owner", "manager", "coach", "captain"].includes(userRole)
              ? "Captain-only calendar - requires captain or higher role"
              : undefined,
          role: userRole,
          visibility,
        };

      case "team-only":
        // All active team members
        return {
          allowed: !!userRole,
          reason: !userRole ? "Team-only calendar - requires team membership" : undefined,
          role: userRole,
          visibility,
        };

      case "selected-members":
        // Check explicit permissions or creator
        if (userId === calendar.created_by) {
          return {
            allowed: true,
            role: userRole,
            visibility,
          };
        }

        const { data: permission } = await client
          .from("calendar_member_permissions")
          .select("can_view")
          .eq("calendar_id", calendarId)
          .eq("member_user_id", userId)
          .is("deleted_at", null)
          .eq("can_view", true)
          .maybeSingle();

        return {
          allowed: !!permission,
          reason: !permission ? "Selected-members calendar - no explicit access granted" : undefined,
          role: userRole,
          visibility,
        };

      case "public-workspace":
        // All org members
        return {
          allowed: true,
          role: userRole,
          visibility,
        };

      default:
        return {
          allowed: false,
          reason: "Unknown visibility level",
          role: userRole,
        };
    }
  } catch (err) {
    console.error("Error checking calendar visibility:", err);
    return {
      allowed: false,
      reason: options.verbose ? "Permission check failed" : undefined,
      role: null,
    };
  }
}

// ============================================================================
// 3. Check Event Visibility
// ============================================================================

/**
 * Check if user can view a specific event
 * Considers event-level visibility override or falls back to calendar visibility
 *
 * @param userId - User's UUID
 * @param eventId - Event's UUID
 * @param organizationId - Organization's UUID
 * @param options - Additional check options
 * @returns Permission check result
 */
export async function checkEventVisibility(
  userId: string,
  eventId: string,
  organizationId: string,
  options: PermissionCheckOptions = {},
): Promise<PermissionCheckResult> {
  try {
    const client = await createClient();
    const userRole = await getUserRoleInOrg(userId, organizationId);

    // Get event visibility override
    const { data: eventVis } = await client
      .from("event_visibility")
      .select("id, visibility, allowed_member_ids, event_id, calendar_id")
      .eq("event_id", eventId)
      .maybeSingle();

    let visibility: CalendarVisibility;
    let allowedMembers: string[] | undefined;
    let calendarId: string | null = null;

    if (eventVis) {
      // Use event-specific visibility
      visibility = eventVis.visibility as CalendarVisibility;
      allowedMembers = eventVis.allowed_member_ids;
      calendarId = eventVis.calendar_id;
    } else {
      // Fall back to calendar's visibility
      const { data: event } = await client
        .from("calendar_events")
        .select("calendar_id")
        .eq("id", eventId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!event) {
        return {
          allowed: false,
          reason: "Event not found",
          role: userRole,
        };
      }

      if (!event.calendar_id) {
        // Orphaned event - deny access
        return {
          allowed: false,
          reason: "Event not associated with calendar",
          role: userRole,
        };
      }

      calendarId = event.calendar_id;
      const calendarResult = await checkCalendarVisibility(
        userId,
        calendarId,
        organizationId,
        options,
      );

      return calendarResult;
    }

    // Get event creator for private/selected-member checks
    const { data: event } = await client
      .from("calendar_events")
      .select("created_by")
      .eq("id", eventId)
      .maybeSingle();

    // Apply visibility rules
    switch (visibility) {
      case "private":
        return {
          allowed: userId === event?.created_by,
          reason: userId !== event?.created_by ? "Private event - creator only" : undefined,
          role: userRole,
          visibility,
        };

      case "management-only":
        return {
          allowed: !!(userRole && ["owner", "manager", "coach"].includes(userRole)),
          reason:
            !userRole || !["owner", "manager", "coach"].includes(userRole)
              ? "Management-only event"
              : undefined,
          role: userRole,
          visibility,
        };

      case "captain-only":
        return {
          allowed: !!(userRole && ["owner", "manager", "coach", "captain"].includes(userRole)),
          reason:
            !userRole || !["owner", "manager", "coach", "captain"].includes(userRole)
              ? "Captain-only event"
              : undefined,
          role: userRole,
          visibility,
        };

      case "team-only":
        return {
          allowed: !!userRole,
          reason: !userRole ? "Team-only event - requires team membership" : undefined,
          role: userRole,
          visibility,
        };

      case "selected-members":
        return {
          allowed:
            (allowedMembers && allowedMembers.includes(userId)) ||
            userId === event?.created_by,
          reason:
            !allowedMembers?.includes(userId) && userId !== event?.created_by
              ? "Selected-members event - no access granted"
              : undefined,
          role: userRole,
          visibility,
        };

      case "public-workspace":
        return {
          allowed: true,
          role: userRole,
          visibility,
        };

      default:
        return {
          allowed: false,
          reason: "Unknown visibility level",
          role: userRole,
        };
    }
  } catch (err) {
    console.error("Error checking event visibility:", err);
    return {
      allowed: false,
      reason: options.verbose ? "Event visibility check failed" : undefined,
      role: null,
    };
  }
}

// ============================================================================
// 4. Check Calendar Permission
// ============================================================================

/**
 * Comprehensive permission check for calendar operations
 * Checks role, visibility, and explicit permissions
 *
 * @param userId - User's UUID
 * @param calendarId - Calendar's UUID
 * @param permission - Permission to check (view, create-event, edit-event, etc.)
 * @param organizationId - Organization's UUID
 * @returns Permission check result
 */
export async function checkCalendarPermission(
  userId: string,
  calendarId: string,
  permission: CalendarPermission,
  organizationId: string,
  options: PermissionCheckOptions = {},
): Promise<PermissionCheckResult> {
  try {
    // First check visibility
    const visibilityCheck = await checkCalendarVisibility(
      userId,
      calendarId,
      organizationId,
      options,
    );

    if (!visibilityCheck.allowed) {
      return visibilityCheck;
    }

    const client = await createClient();
    const userRole = visibilityCheck.role;

    // Get calendar
    const { data: calendar } = await client
      .from("calendar_configs")
      .select("created_by, visibility")
      .eq("id", calendarId)
      .maybeSingle();

    if (!calendar) {
      return {
        allowed: false,
        reason: "Calendar not found",
        role: userRole,
      };
    }

    // Permission decision based on role and calendar
    const isCreator = userId === calendar.created_by;
    const visibility = calendar.visibility as CalendarVisibility;

    // Determine if user can perform specific action
    switch (permission) {
      case "view":
        return visibilityCheck;

      case "manage-calendar":
        // Owner or creator (if captain/coach/manager)
        return {
          allowed:
            userRole === "owner" ||
            isCreator,
          reason:
            userRole !== "owner" && !isCreator
              ? `${permission} - requires owner or creator status`
              : undefined,
          role: userRole,
          visibility,
        };

      case "create-event":
        // Check if role can create in this visibility level
        return {
          allowed:
            userRole === "owner" ||
            (userRole === "manager" && visibility !== "private") ||
            (userRole === "coach" && visibility !== "private") ||
            (userRole === "captain" && isCreator) ||
            (isCreator && userRole === "captain"),
          reason: !visibilityCheck.allowed ? "Cannot view calendar" : "Cannot create events",
          role: userRole,
          visibility,
        };

      case "edit-event":
      case "delete-event":
        // Check explicit permissions for selected-members
        if (visibility === "selected-members") {
          const { data: perm } = await client
            .from("calendar_member_permissions")
            .select("can_edit_event, can_delete_event")
            .eq("calendar_id", calendarId)
            .eq("member_user_id", userId)
            .maybeSingle();

          const hasPermission =
            permission === "edit-event" ? perm?.can_edit_event : perm?.can_delete_event;

          if (!hasPermission && !isCreator && userRole !== "owner") {
            return {
              allowed: false,
              reason: `No explicit ${permission} permission`,
              role: userRole,
              visibility,
            };
          }
        }

        return {
          allowed:
            userRole === "owner" ||
            (userRole === "manager" && visibility !== "private") ||
            (userRole === "coach" && visibility !== "private"),
          reason: !visibilityCheck.allowed ? "Cannot view calendar" : `Cannot ${permission}`,
          role: userRole,
          visibility,
        };

      case "manage-permissions":
        return {
          allowed: userRole === "owner" || isCreator,
          reason:
            userRole !== "owner" && !isCreator
              ? "manage-permissions - requires owner or creator status"
              : undefined,
          role: userRole,
          visibility,
        };

      default:
        return {
          allowed: false,
          reason: "Unknown permission",
          role: userRole,
          visibility,
        };
    }
  } catch (err) {
    console.error("Error checking calendar permission:", err);
    return {
      allowed: false,
      reason: options.verbose ? "Permission check failed" : undefined,
      role: null,
    };
  }
}

// ============================================================================
// 5. Get Accessible Calendars
// ============================================================================

/**
 * In-memory mirror of the checkCalendarVisibility switch, used by the bulk
 * list paths (getAccessibleCalendars / getAccessibleEvents) so they don't
 * issue one DB roundtrip per row (PRF-01).
 */
function calendarVisibilityAllows(
  visibility: CalendarVisibility,
  ctx: {
    userId: string;
    userRole: UserRole | null;
    createdBy?: string | null;
    permission?: { can_view?: boolean | null } | null;
  },
): boolean {
  switch (visibility) {
    case "private":
      return ctx.userId === ctx.createdBy;
    case "management-only":
      return !!(ctx.userRole && ["owner", "manager", "coach"].includes(ctx.userRole));
    case "captain-only":
      return !!(ctx.userRole && ["owner", "manager", "coach", "captain"].includes(ctx.userRole));
    case "team-only":
      return !!ctx.userRole;
    case "selected-members":
      return ctx.userId === ctx.createdBy || ctx.permission?.can_view === true;
    case "public-workspace":
      return true;
    default:
      return false;
  }
}

/**
 * In-memory mirror of the checkEventVisibility override switch (bulk paths).
 */
function eventVisibilityAllows(
  visibility: CalendarVisibility,
  ctx: {
    userId: string;
    userRole: UserRole | null;
    createdBy?: string | null;
    allowedMembers?: string[] | null;
  },
): boolean {
  switch (visibility) {
    case "private":
      return ctx.userId === ctx.createdBy;
    case "management-only":
      return !!(ctx.userRole && ["owner", "manager", "coach"].includes(ctx.userRole));
    case "captain-only":
      return !!(ctx.userRole && ["owner", "manager", "coach", "captain"].includes(ctx.userRole));
    case "team-only":
      return !!ctx.userRole;
    case "selected-members":
      return (
        (ctx.allowedMembers?.includes(ctx.userId) ?? false) ||
        ctx.userId === ctx.createdBy
      );
    case "public-workspace":
      return true;
    default:
      return false;
  }
}

/**
 * Get all calendars accessible to the user
 * Filters based on visibility and explicit permissions
 *
 * @param userId - User's UUID
 * @param organizationId - Organization's UUID
 * @param options - Query options (limit, includeDeleted, etc.)
 * @returns Array of accessible calendars
 */
export async function getAccessibleCalendars(
  userId: string,
  organizationId: string,
  options: { limit?: number; offset?: number; includeDeleted?: boolean } = {},
): Promise<AccessibleCalendarResult[]> {
  try {
    const client = await createClient();
    const userRole = await getUserRoleInOrg(userId, organizationId);

    // Base query
    let query = client
      .from("calendar_configs")
      .select(
        `
        id,
        organization_id,
        division_id,
        created_by,
        title,
        description,
        visibility,
        is_active,
        created_at,
        updated_at,
        deleted_at,
        updated_by
      `,
      )
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (!options.includeDeleted) {
      query = query.is("deleted_at", null);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data: calendars } = await query;

    if (!calendars) {
      return [];
    }

    // Bulk-fetch this user's explicit permissions for all selected-members
    // calendars in one query instead of one query per calendar (PRF-01).
    const selectedMemberIds = calendars
      .filter((c) => c.visibility === "selected-members")
      .map((c) => c.id);

    const permByCalendar = new Map<string, CalendarMemberPermission>();
    if (selectedMemberIds.length > 0) {
      const { data: perms, error: permError } = await client
        .from("calendar_member_permissions")
        .select("*")
        .in("calendar_id", selectedMemberIds)
        .eq("member_user_id", userId)
        .is("deleted_at", null)
        .limit(200);
      if (permError) {
        console.error("Error fetching calendar member permissions:", permError);
      }
      for (const perm of (perms ?? []) as CalendarMemberPermission[]) {
        permByCalendar.set(perm.calendar_id, perm);
      }
    }

    // Filter based on visibility and role — in memory, no per-row queries
    const result: AccessibleCalendarResult[] = [];

    for (const calendar of calendars) {
      // Parity with checkCalendarVisibility: deleted calendars are never visible
      if (calendar.deleted_at) {
        continue;
      }

      const visibility = calendar.visibility as CalendarVisibility;
      const userPermissions = permByCalendar.get(calendar.id) ?? null;

      const allowed = calendarVisibilityAllows(visibility, {
        userId,
        userRole,
        createdBy: calendar.created_by,
        permission: userPermissions,
      });
      if (!allowed) {
        continue;
      }

      result.push({
        ...(calendar as unknown as import("@/lib/permissions/calendar-types").CalendarConfig),
        userPermissions: visibility === "selected-members" ? userPermissions : null,
      });
    }

    return result;
  } catch (err) {
    console.error("Error getting accessible calendars:", err);
    return [];
  }
}

// ============================================================================
// 6. Get Accessible Events
// ============================================================================

/**
 * Get all events accessible to the user within date range
 * Filters based on calendar and event visibility
 *
 * @param userId - User's UUID
 * @param organizationId - Organization's UUID
 * @param dateRange - Date range filter {from, to}
 * @param options - Query options
 * @returns Array of accessible events
 */
export async function getAccessibleEvents(
  userId: string,
  organizationId: string,
  dateRange: { from: string; to: string },
  options: { limit?: number; offset?: number } = {},
): Promise<AccessibleEventResult[]> {
  try {
    const client = await createClient();
    const userRole = await getUserRoleInOrg(userId, organizationId);

    // Get accessible calendars first
    const calendars = await getAccessibleCalendars(userId, organizationId);
    const calendarIds = calendars.map((c) => c.id);
    const calendarVisibilityById = new Map(
      calendars.map((c) => [c.id, c.visibility as CalendarVisibility]),
    );

    if (calendarIds.length === 0) {
      return [];
    }

    // Query events in accessible calendars
    let query = client
      .from("calendar_events")
      .select(
        `
        id,
        title,
        event_type,
        starts_at,
        ends_at,
        created_by,
        calendar_id
      `,
      )
      .eq("organization_id", organizationId)
      .in("calendar_id", calendarIds)
      .gte("starts_at", dateRange.from)
      .lte("starts_at", dateRange.to)
      .order("starts_at", { ascending: true });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data: events } = await query;

    if (!events) {
      return [];
    }

    // Bulk-fetch event-level visibility overrides in one query instead of
    // two queries per event (PRF-01).
    const overrideByEvent = new Map<
      string,
      { visibility: CalendarVisibility; allowed_member_ids: string[] | null }
    >();
    if (events.length > 0) {
      const { data: overrides, error: overrideError } = await client
        .from("event_visibility")
        .select("event_id, visibility, allowed_member_ids")
        .in(
          "event_id",
          events.map((e) => e.id),
        )
        .limit(500);
      if (overrideError) {
        console.error("Error fetching event visibility overrides:", overrideError);
      }
      for (const o of overrides ?? []) {
        overrideByEvent.set(o.event_id, {
          visibility: o.visibility as CalendarVisibility,
          allowed_member_ids: o.allowed_member_ids,
        });
      }
    }

    const result: AccessibleEventResult[] = [];

    for (const event of events) {
      const override = overrideByEvent.get(event.id);

      if (!override) {
        // No override → event inherits its calendar's visibility. Events are
        // only queried from calendars the user can already access, so the
        // calendar-level check has effectively passed.
        const calVisibility = event.calendar_id
          ? calendarVisibilityById.get(event.calendar_id)
          : undefined;
        if (!calVisibility) {
          // Orphaned event (no calendar) — deny, parity with checkEventVisibility
          continue;
        }
        result.push({
          id: event.id,
          title: event.title,
          event_type: event.event_type,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          visibility: calVisibility,
          calendar_id: event.calendar_id || undefined,
          created_by: event.created_by,
        });
        continue;
      }

      const allowed = eventVisibilityAllows(override.visibility, {
        userId,
        userRole,
        createdBy: event.created_by,
        allowedMembers: override.allowed_member_ids,
      });
      if (!allowed) {
        continue;
      }

      result.push({
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        visibility: override.visibility || "team-only",
        calendar_id: event.calendar_id || undefined,
        created_by: event.created_by,
      });
    }

    return result;
  } catch (err) {
    console.error("Error getting accessible events:", err);
    return [];
  }
}

// ============================================================================
// 7. Check if User Can Manage Calendars
// ============================================================================

/**
 * Check if user can create/manage calendars in organization
 * Returns true for owner, manager, coach, and captain roles
 *
 * @param userId - User's UUID
 * @param organizationId - Organization's UUID
 * @returns true if user can manage calendars
 */
export async function userCanManageCalendars(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const role = await getUserRoleInOrg(userId, organizationId);
  return role ? ["owner", "manager", "coach", "captain"].includes(role) : false;
}

// ============================================================================
// 8. Get Permission Context
// ============================================================================

/**
 * Get complete permission context for a user in organization
 * Used for caching and decision-making
 *
 * @param userId - User's UUID
 * @param organizationId - Organization's UUID
 * @returns Permission context object
 */
export async function getPermissionContext(
  userId: string,
  organizationId: string,
): Promise<{
  role: UserRole | null;
  orgId: string;
  canManage: boolean;
}> {
  const role = await getUserRoleInOrg(userId, organizationId);
  const canManage = await userCanManageCalendars(userId, organizationId);

  return {
    role,
    orgId: organizationId,
    canManage,
  };
}
