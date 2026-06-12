/**
 * GET /api/calendar/permissions/[calendarId]
 * Get calendar's member permissions
 *
 * PUT /api/calendar/permissions/[calendarId]
 * Update calendar permissions (manager+ only)
 * Body: { permissions: Record<string, CalendarMemberPermission> }
 */

import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateRequest,
  requireRole,
  applyRateLimit,
  requireCalendarPermission,
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

    // Apply rate limiting
    const rateLimit = await applyRateLimit(user!.id);
    if (!rateLimit.allowed) {
      return unauthorized("Rate limited");
    }

    const supabase = await createClient();

    // Verify calendar exists and user has access
    const { data: calendar } = await supabase
      .from("calendar_configs")
      .select("id, organization_id")
      .eq("id", calendarId)
      .eq("organization_id", orgId!)
      .maybeSingle();

    if (!calendar) {
      return notFound("Calendar not found");
    }

    // Get member permissions
    const { data: permissions, error: queryError } = await supabase
      .from("calendar_member_permissions")
      .select(
        `
        id,
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
      )
      .eq("calendar_id", calendarId)
      .is("deleted_at", null);

    if (queryError) {
      console.error("Query error:", queryError);
      return internalError();
    }

    return success({ permissions: permissions || [] });
  } catch (err) {
    console.error("Calendar permissions GET error:", err);
    return internalError();
  }
}

export async function PUT(
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

    const supabase = await createClient();

    // Verify calendar exists
    const { data: calendar } = await supabase
      .from("calendar_configs")
      .select("id")
      .eq("id", calendarId)
      .eq("organization_id", orgId!)
      .maybeSingle();

    if (!calendar) {
      return notFound("Calendar not found");
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    if (!body.permissions || typeof body.permissions !== "object") {
      return badRequest("Missing or invalid permissions object");
    }

    // Validate all supplied member IDs belong to this org
    const memberIds = Object.keys(body.permissions).filter((id) => isValidUUID(id));
    if (memberIds.length > 0) {
      const { data: validMembers } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("organization_id", orgId!)
        .in("user_id", memberIds);
      const validSet = new Set((validMembers ?? []).map((m) => m.user_id));
      for (const memberId of memberIds) {
        if (!validSet.has(memberId)) {
          return badRequest(`Member ${memberId} tidak ditemukan di organisasi ini`);
        }
      }
    }

    // Update each member's permissions
    const updates = [];
    for (const [memberId, perms] of Object.entries(body.permissions)) {
      if (!isValidUUID(memberId)) {
        return badRequest(`Invalid member ID: ${memberId}`);
      }

      const perm = perms as Record<string, unknown>;

      updates.push(
        supabase
          .from("calendar_member_permissions")
          .upsert(
            {
              calendar_id: calendarId,
              member_user_id: memberId,
              organization_id: orgId!,
              can_view: Boolean(perm.can_view ?? true),
              can_create_event: Boolean(perm.can_create_event ?? false),
              can_edit_event: Boolean(perm.can_edit_event ?? false),
              can_delete_event: Boolean(perm.can_delete_event ?? false),
              can_manage_permissions: Boolean(perm.can_manage_permissions ?? false),
              updated_by: user!.id,
              created_by: user!.id,
            },
            {
              onConflict: "calendar_id,member_user_id",
            },
          ),
      );
    }

    await Promise.all(updates);

    return success({ ok: true, message: "Permissions updated" });
  } catch (err) {
    console.error("Calendar permissions PUT error:", err);
    return internalError();
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
