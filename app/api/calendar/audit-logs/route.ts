/**
 * GET /api/calendar/audit-logs
 * List audit logs (manager+ only)
 *
 * Query params:
 * - calendarId?: Filter by calendar
 * - eventId?: Filter by event
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const calendarId = searchParams.get("calendarId");
    const eventId = searchParams.get("eventId");
    const action = searchParams.get("action");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      100,
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const supabase = await createClient();

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("calendar_audit_logs")
      .select("id, action, actor_id, calendar_id, changes, created_at, entity_type, event_id, metadata, organization_id", { count: "exact" })
      .eq("organization_id", orgId!)
      .order("created_at", { ascending: false });

    // Apply filters
    if (calendarId && isValidUUID(calendarId)) {
      query = query.eq("calendar_id", calendarId);
    }

    if (eventId && isValidUUID(eventId)) {
      query = query.eq("event_id", eventId);
    }

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
    });
  } catch (err) {
    console.error("Audit logs GET error:", err);
    return internalError();
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function isValidISO8601(date: string): boolean {
  try {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  } catch {
    return false;
  }
}
