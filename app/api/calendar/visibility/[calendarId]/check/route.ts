/**
 * POST /api/calendar/visibility/[calendarId]/check
 * Check if current user can access calendar with specific permission
 *
 * Body: { permission: 'view' | 'create-event' | 'edit-event' | 'delete-event' | 'manage' }
 * Response: { allowed: boolean, reason?: string, requiredRole?: UserRole }
 */

import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateRequest,
  requireCalendarPermission,
  applyRateLimit,
  type CalendarPermission,
} from "@/lib/api/permission-middleware";
import {
  success,
  unauthorized,
  notFound,
  badRequest,
  internalError,
} from "@/lib/api/response";

export async function POST(
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

    const { user } = validation;

    // Apply rate limiting
    const rateLimit = await applyRateLimit(user!.id);
    if (!rateLimit.allowed) {
      return unauthorized("Rate limited");
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { permission } = body;

    const validPermissions = [
      "view",
      "create-event",
      "edit-event",
      "delete-event",
      "manage",
    ];

    if (!permission || !validPermissions.includes(permission)) {
      return badRequest("Invalid permission. Must be one of: view, create-event, edit-event, delete-event, manage");
    }

    const supabase = await createClient();

    // Verify calendar exists
    const { data: calendar } = await supabase
      .from("calendar_configs")
      .select("id, visibility")
      .eq("id", calendarId)
      .maybeSingle();

    if (!calendar) {
      return notFound("Calendar not found");
    }

    // Check permission using the permission middleware function
    const permCheck = await requireCalendarPermission(
      user!.id,
      calendarId,
      permission as CalendarPermission,
    );

    return success({
      allowed: permCheck.allowed,
      reason: permCheck.error,
      calendar: {
        id: calendar.id,
        visibility: calendar.visibility,
      },
    });
  } catch (err) {
    console.error("Calendar permission check error:", err);
    return internalError();
  }
}
