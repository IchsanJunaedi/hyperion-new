/**
 * GET /api/calendar/events/[eventId]/visibility
 * Get event visibility (with override detection)
 *
 * PUT /api/calendar/events/[eventId]/visibility
 * Set event visibility override
 *
 * DELETE /api/calendar/events/[eventId]/visibility
 * Reset event visibility to calendar default
 */

import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  badRequest,
  internalError,
} from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;

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

    const supabase = await createClient();

    // Get event
    const { data: event } = await supabase
      .from("calendar_events")
      .select("id, calendar_id")
      .eq("id", eventId)
      .maybeSingle();

    if (!event) {
      return notFound("Event not found");
    }

    // Get event visibility override if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: override } = await (supabase as any)
      .from("event_visibility")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    // Get calendar visibility (default)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventAny = event as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: calendar } = eventAny.calendar_id ? await (supabase as any)
      .from("calendar_configs")
      .select("visibility")
      .eq("id", eventAny.calendar_id)
      .maybeSingle() : { data: null };

    return success({
      eventId,
      calendarVisibility: calendar?.visibility || "team-only",
      override: override || null,
      effectiveVisibility: override?.visibility || calendar?.visibility,
      allowedMembers: override?.allowed_member_ids || [],
    });
  } catch (err) {
    console.error("Event visibility GET error:", err);
    return internalError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;

    // Validate request
    const validation = await validateRequest(request);
    if (!validation.valid) {
      return unauthorized(validation.error);
    }

    const { user, orgId } = validation;

    // Check role (captain+ required)
    const roleCheck = await requireRole(user!.id, orgId!, "captain");
    if (!roleCheck.allowed) {
      return forbidden(roleCheck.error);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { visibility, allowedMemberIds } = body;

    if (!visibility || typeof visibility !== "string") {
      return badRequest("Invalid visibility");
    }

    const validVisibilities = [
      "private",
      "management-only",
      "captain-only",
      "team-only",
      "selected-members",
      "public-workspace",
    ];

    if (!validVisibilities.includes(visibility)) {
      return badRequest("Invalid visibility option");
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // Verify event exists
    const { data: event } = await supabase
      .from("calendar_events")
      .select("id, calendar_id, organization_id")
      .eq("id", eventId)
      .maybeSingle();

    if (!event) {
      return notFound("Event not found");
    }

    // Get or create event visibility override
    const { data: existing } = await admin
      .from("event_visibility")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();

    // Upsert event visibility
    const { error: upsertError } = await admin
      .from("event_visibility")
      .upsert(
        {
          id: existing?.id,
          event_id: eventId,
          calendar_id: event.calendar_id,
          organization_id: event.organization_id,
          visibility,
          allowed_member_ids: Array.isArray(allowedMemberIds)
            ? allowedMemberIds
            : [],
          created_by: user!.id,
          updated_by: user!.id,
        },
        {
          onConflict: "event_id",
        },
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return internalError();
    }

    return success({
      ok: true,
      message: "Event visibility override set",
      visibility,
    });
  } catch (err) {
    console.error("Event visibility PUT error:", err);
    return internalError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params;

    // Validate request
    const validation = await validateRequest(request);
    if (!validation.valid) {
      return unauthorized(validation.error);
    }

    const { user, orgId } = validation;

    // Check role (captain+ required)
    const roleCheck = await requireRole(user!.id, orgId!, "captain");
    if (!roleCheck.allowed) {
      return forbidden(roleCheck.error);
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // Verify event exists
    const { data: event } = await supabase
      .from("calendar_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (!event) {
      return notFound("Event not found");
    }

    // Delete event visibility override
    const { error: deleteError } = await admin
      .from("event_visibility")
      .delete()
      .eq("event_id", eventId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return internalError();
    }

    return success({
      ok: true,
      message: "Event visibility override removed - using calendar default",
    });
  } catch (err) {
    console.error("Event visibility DELETE error:", err);
    return internalError();
  }
}
