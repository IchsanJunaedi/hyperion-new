/**
 * GET /api/calendar/audit-logs/[calendarId]
 * Get audit logs for specific calendar (manager+ only)
 *
 * Query params:
 * - action?: Filter by action type
 * - from?: Start date (ISO 8601)
 * - to?: End date (ISO 8601)
 * - limit?: Results per page (default: 50)
 * - offset?: Pagination offset (default: 0)
 *
 * Response: { logs: CalendarAuditLog[], total: number }
 */

import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateRequest,
  requireRole,
  applyRateLimit,
} from "@/lib/api/permission-middleware";
import {
  success,
  unauthorized,
  forbidden,
  notFound,
  internalError,
} from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> },
) {
  try {
    const { calendarId } = await params;

    // Validate request
    const validation = await validateRequest(request);
    if (!validation.valid) {
      return unauthorized(validation.error);
    }

    const { user, orgId } = validation;

    // Check role (manager+ required)
    const roleCheck = await requireRole(user!.id, orgId!, "manager");
    if (!roleCheck.allowed) {
      return forbidden(roleCheck.error);
    }

    // Apply rate limiting
    const rateLimit = await applyRateLimit(user!.id);
    if (!rateLimit.allowed) {
      return unauthorized("Rate limited");
    }

    const supabase = await createClient();

    // Verify calendar exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: calendar } = await (supabase as any)
      .from("calendar_configs")
      .select("id")
      .eq("id", calendarId)
      .eq("organization_id", orgId!)
      .maybeSingle();

    if (!calendar) {
      return notFound("Calendar not found");
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      100,
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("calendar_audit_logs")
      .select("id, action, actor_id, calendar_id, changes, created_at, entity_type, event_id, metadata, organization_id", { count: "exact" })
      .eq("calendar_id", calendarId)
      .eq("organization_id", orgId!)
      .order("created_at", { ascending: false });

    // Apply filters
    if (action && typeof action === "string") {
      query = query.eq("action", action);
    }

    if (from && isValidISO8601(from)) {
      query = query.gte("created_at", from);
    }

    if (to && isValidISO8601(to)) {
      query = query.lte("created_at", to);
    }

    // Apply pagination
    const { data: logs, count, error: queryError } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (queryError) {
      console.error("Query error:", queryError);
      return internalError();
    }

    return success({
      logs: logs || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
      calendarId,
    });
  } catch (err) {
    console.error("Calendar audit logs GET error:", err);
    return internalError();
  }
}

function isValidISO8601(date: string): boolean {
  try {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  } catch {
    return false;
  }
}
