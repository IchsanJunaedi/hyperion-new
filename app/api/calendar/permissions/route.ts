/**
 * GET /api/calendar/permissions
 * List all calendar permissions for user's organization
 *
 * Query params:
 * - calendarId?: Filter by specific calendar
 * - limit?: Results per page (default: 50)
 * - offset?: Pagination offset (default: 0)
 *
 * Response: { permissions: CalendarMemberPermissionWithProfile[] }
 */

import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateRequest,
  applyRateLimit,
} from "@/lib/api/permission-middleware";
import {
  success,
  error,
  unauthorized,
  badRequest,
  internalError,
} from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    // Validate request
    const validation = await validateRequest(request);
    if (!validation.valid) {
      return unauthorized(validation.error);
    }

    const { user, orgId } = validation;

    // Apply rate limiting
    const rateLimit = await applyRateLimit(user!.id);
    if (!rateLimit.allowed) {
      return error("Too many requests", 429, {
        code: "RATE_LIMITED",
        resetAt: rateLimit.resetAt,
      });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const calendarId = searchParams.get("calendarId");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      100,
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    // Validate calendar ID if provided
    if (calendarId && !isValidUUID(calendarId)) {
      return badRequest("Invalid calendar ID");
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("calendar_member_permissions")
      .select(
        `
        id,
        calendar_id,
        member_user_id,
        can_view,
        can_create_event,
        can_edit_event,
        can_delete_event,
        can_manage_permissions,
        created_at,
        updated_at,
        profiles:member_user_id (
          id,
          display_name,
          avatar_url
        )
      `,
        { count: "exact" },
      )
      .eq("organization_id", orgId!)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    // Filter by calendar if provided
    if (calendarId) {
      query = query.eq("calendar_id", calendarId);
    }

    // Apply pagination
    const { data: permissions, count, error: queryError } = await query
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error("Query error:", queryError);
      return internalError();
    }

    return success({
      permissions: permissions || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (err) {
    console.error("Calendar permissions GET error:", err);
    return internalError();
  }
}

/**
 * Helper function to validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
