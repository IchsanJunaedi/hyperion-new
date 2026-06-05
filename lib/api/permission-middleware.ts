/**
 * Permission Middleware for Calendar API Routes
 *
 * Provides authentication, authorization, and rate limiting utilities
 * for all calendar-related API endpoints.
 */

import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MemberRole } from "@/types/database";

const OWNER_EMAIL = process.env.OWNER_EMAIL;

/**
 * Validate request and extract user information
 *
 * @param req - Next.js request object
 * @returns Validation result with user and org info
 *
 * @example
 * ```typescript
 * const validation = await validateRequest(req)
 * if (!validation.valid) {
 *   return unauthorized(validation.error)
 * }
 * ```
 */
export async function validateRequest(
  req: NextRequest,
): Promise<{
  valid: boolean;
  user: { id: string; email: string } | null;
  orgId: string | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        valid: false,
        user: null,
        orgId: null,
        error: "Unauthorized",
      };
    }

    // Get organization ID from headers (set by middleware)
    const orgSlug = req.headers.get("x-org-slug");
    if (!orgSlug) {
      return {
        valid: false,
        user: { id: user.id, email: user.email || "" },
        orgId: null,
        error: "Missing organization context",
      };
    }

    // Resolve org slug to org ID
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", orgSlug)
      .maybeSingle();

    if (!org) {
      return {
        valid: false,
        user: { id: user.id, email: user.email || "" },
        orgId: null,
        error: "Organization not found",
      };
    }

    // Verify membership: user must be active member of the organization OR be the global owner
    const isGlobalOwner = isOwner(user.email || "");
    if (!isGlobalOwner) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("organization_id", org.id)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!membership) {
        return {
          valid: false,
          user: { id: user.id, email: user.email || "" },
          orgId: null,
          error: "Forbidden: Not a member of this organization",
        };
      }
    }

    return {
      valid: true,
      user: { id: user.id, email: user.email || "" },
      orgId: org.id,
    };
  } catch (err) {
    console.error("Validation error:", err);
    return {
      valid: false,
      user: null,
      orgId: null,
      error: "Validation failed",
    };
  }
}

/**
 * Check if user is the organization owner
 *
 * @param userEmail - User's email address
 * @returns true if user is owner
 */
export function isOwner(userEmail: string): boolean {
  if (!OWNER_EMAIL) return false;
  return userEmail === OWNER_EMAIL;
}

/**
 * Get user's role in the organization
 *
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns User's role or null if not a member
 */
export async function getUserRole(
  userId: string,
  orgId: string,
): Promise<MemberRole | null> {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("team_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .maybeSingle();

    return (data?.role as MemberRole) || null;
  } catch (err) {
    console.error("Error getting user role:", err);
    return null;
  }
}

/**
 * Check if user meets minimum role requirement
 *
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param minRole - Minimum required role
 * @returns Permission check result
 *
 * @example
 * ```typescript
 * const check = await requireRole(userId, orgId, 'manager')
 * if (!check.allowed) {
 *   return forbidden(check.error)
 * }
 * ```
 */
export async function requireRole(
  userId: string,
  orgId: string,
  minRole: MemberRole,
): Promise<{
  allowed: boolean;
  userRole?: MemberRole | null;
  error?: string;
}> {
  const roleHierarchy: Record<MemberRole, number> = {
    owner: 5,
    manager: 4,
    coach: 3,
    captain: 2,
    member: 1,
  };

  const userRole = await getUserRole(userId, orgId);

  if (!userRole) {
    return {
      allowed: false,
      userRole: null,
      error: `User is not a member of organization`,
    };
  }

  const userLevel = roleHierarchy[userRole] ?? 0;
  const minLevel = roleHierarchy[minRole] ?? 0;

  if (userLevel < minLevel) {
    return {
      allowed: false,
      userRole,
      error: `Requires ${minRole} role or higher`,
    };
  }

  return {
    allowed: true,
    userRole,
  };
}

export type CalendarPermission =
  | "view"
  | "create-event"
  | "edit-event"
  | "delete-event"
  | "manage";

/**
 * Check if user has specific permission on a calendar
 *
 * @param userId - User ID
 * @param calendarId - Calendar ID
 * @param permission - Permission to check
 * @returns Permission check result
 */
export async function requireCalendarPermission(
  userId: string,
  calendarId: string,
  permission: CalendarPermission,
): Promise<{
  allowed: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get calendar and verify it exists
    const { data: calendar } = await supabase
      .from("calendar_configs")
      .select("id, organization_id")
      .eq("id", calendarId)
      .maybeSingle();

    if (!calendar) {
      return {
        allowed: false,
        error: "Calendar not found",
      };
    }

    // Check explicit member permissions
    const { data: memberPerm } = await supabase
      .from("calendar_member_permissions")
      .select(
        "can_view, can_create_event, can_edit_event, can_delete_event, can_manage_permissions",
      )
      .eq("calendar_id", calendarId)
      .eq("member_user_id", userId)
      .maybeSingle();

    // Map permission to column
    const permissionMap: Record<CalendarPermission, string> = {
      view: "can_view",
      "create-event": "can_create_event",
      "edit-event": "can_edit_event",
      "delete-event": "can_delete_event",
      manage: "can_manage_permissions",
    };

    const permColumn = permissionMap[permission];

    if (memberPerm && memberPerm[permColumn as keyof typeof memberPerm]) {
      return { allowed: true };
    }

    // Check role-based permissions via visibility rules
    const userRole = await getUserRole(userId, calendar.organization_id);

    const { data: visibility } = await supabase
      .from("calendar_configs")
      .select("visibility")
      .eq("id", calendarId)
      .maybeSingle();

    if (!visibility) {
      return {
        allowed: false,
        error: "Calendar visibility not found",
      };
    }

    // Role-based permission logic
    const visibilityPermissions: Record<string, string[]> = {
      private: [],
      "management-only": ["owner", "manager"],
      "captain-only": ["owner", "manager", "captain"],
      "team-only": ["owner", "manager", "captain", "member"],
      "selected-members": ["owner", "manager"], // Check explicit members for others
      "public-workspace": ["owner", "manager", "captain", "member"],
    };

    const allowedRoles = visibilityPermissions[visibility.visibility] || [];

    if (userRole && allowedRoles.includes(userRole)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      error: `Insufficient permissions for ${permission}`,
    };
  } catch (err) {
    console.error("Calendar permission check error:", err);
    return {
      allowed: false,
      error: "Permission check failed",
    };
  }
}

/**
 * Apply rate limiting to API calls
 *
 * @param userId - User ID for rate limit key
 * @param limit - Requests per minute (default: 100)
 * @returns Rate limit result
 *
 * @example
 * ```typescript
 * const rateLimit = await applyRateLimit(userId)
 * if (!rateLimit.allowed) {
 *   return error('Too many requests', 429)
 * }
 * ```
 */
export async function applyRateLimit(
  userId: string,
  limit: number = 100,
): Promise<{
  allowed: boolean;
  remaining?: number;
  resetAt?: number;
}> {
  const now = new Date();
  const identifier = `api:${userId}`;
  const windowMs = 60 * 1000; // 60 seconds

  try {
    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from("login_rate_limits")
      .select("attempts, updated_at, locked_until")
      .eq("identifier", identifier)
      .maybeSingle();

    const lastUpdate = data?.updated_at ? new Date(data.updated_at) : null;
    const isWindowExpired =
      !lastUpdate || now.getTime() - lastUpdate.getTime() > windowMs;

    let newAttempts = 1;
    let resetAt = now.getTime() + windowMs;

    if (!isWindowExpired && data) {
      newAttempts = data.attempts + 1;
      resetAt = lastUpdate.getTime() + windowMs;
    }

    if (newAttempts > limit) {
      // Upsert to record rate limit exceeded
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("login_rate_limits").upsert({
        identifier,
        attempts: newAttempts,
        locked_until: new Date(resetAt).toISOString(),
        updated_at: isWindowExpired ? now.toISOString() : data.updated_at,
      });

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("login_rate_limits").upsert({
      identifier,
      attempts: newAttempts,
      locked_until: null,
      updated_at: isWindowExpired ? now.toISOString() : data.updated_at,
    });

    return {
      allowed: true,
      remaining: limit - newAttempts,
      resetAt,
    };
  } catch (err) {
    console.error("Rate limit DB error:", err);
    // Fail-safe to allow request in case of database connectivity issues
    return {
      allowed: true,
      remaining: 1,
      resetAt: now.getTime() + windowMs,
    };
  }
}

/**
 * Get organization owner email for comparison
 * Used for determining if user is owner based on email
 */
export function getOwnerEmail(): string | null {
  return OWNER_EMAIL || null;
}
