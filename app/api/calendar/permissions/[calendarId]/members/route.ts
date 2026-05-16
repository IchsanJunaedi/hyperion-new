/**
 * POST /api/calendar/permissions/[calendarId]/members
 * Grant permission ke member
 *
 * DELETE /api/calendar/permissions/[calendarId]/members
 * Revoke member permission
 * Query: memberId
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
import { cascadePermissionChange } from "@/lib/api/calendar-cascade";

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
      .select("id, title")
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

    const { memberUserId, permissions } = body;

    if (!memberUserId || !isValidUUID(memberUserId)) {
      return badRequest("Invalid member user ID");
    }

    if (!permissions || typeof permissions !== "object") {
      return badRequest("Missing or invalid permissions object");
    }

    // Verify member exists in organization
    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", memberUserId)
      .eq("organization_id", orgId!)
      .maybeSingle();

    if (!member) {
      return badRequest("Member not found in organization");
    }

    const admin = createAdminClient();

    // Get existing permissions for audit
    const { data: oldPerms } = await admin
      .from("calendar_member_permissions")
      .select("*")
      .eq("calendar_id", calendarId)
      .eq("member_user_id", memberUserId)
      .maybeSingle();

    // Grant or update permissions
    const { error: insertError } = await admin
      .from("calendar_member_permissions")
      .upsert(
        {
          id: oldPerms?.id,
          calendar_id: calendarId,
          member_user_id: memberUserId,
          organization_id: orgId!,
          can_view: Boolean(permissions.can_view ?? true),
          can_create_event: Boolean(permissions.can_create_event ?? false),
          can_edit_event: Boolean(permissions.can_edit_event ?? false),
          can_delete_event: Boolean(permissions.can_delete_event ?? false),
          can_manage_permissions: Boolean(permissions.can_manage_permissions ?? false),
          created_by: oldPerms?.created_by || user!.id,
          updated_by: user!.id,
        },
        {
          onConflict: "calendar_id,member_user_id",
        },
      );

    if (insertError) {
      console.error("Insert error:", insertError);
      return internalError();
    }

    // Get updated permissions for audit
    const { data: newPerms } = await admin
      .from("calendar_member_permissions")
      .select("*")
      .eq("calendar_id", calendarId)
      .eq("member_user_id", memberUserId)
      .maybeSingle();

    // Cascade permission change (audit log, notifications, cache invalidation)
    if (oldPerms && newPerms) {
      await cascadePermissionChange(calendarId, memberUserId, oldPerms, newPerms);
    }

    return success({ ok: true, message: "Member permission granted" });
  } catch (err) {
    console.error("Grant permission error:", err);
    return internalError();
  }
}

export async function DELETE(
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

    // Get memberId from query params
    const memberId = request.nextUrl.searchParams.get("memberId");
    if (!memberId || !isValidUUID(memberId)) {
      return badRequest("Invalid member ID");
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

    const admin = createAdminClient();

    // Get existing permissions for audit
    const { data: oldPerms } = await admin
      .from("calendar_member_permissions")
      .select("*")
      .eq("calendar_id", calendarId)
      .eq("member_user_id", memberId)
      .maybeSingle();

    if (!oldPerms) {
      return notFound("Member permission not found");
    }

    // Soft delete the permission
    const { error: deleteError } = await admin
      .from("calendar_member_permissions")
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user!.id,
      })
      .eq("id", oldPerms.id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return internalError();
    }

    // Cascade permission removal (audit log, notifications, cache invalidation)
    const newPerms = {
      ...oldPerms,
      can_view: false,
      can_create_event: false,
      can_edit_event: false,
      can_delete_event: false,
      can_manage_permissions: false,
      deleted_at: new Date().toISOString(),
      updated_by: user!.id,
    };
    await cascadePermissionChange(calendarId, memberId, oldPerms, newPerms);

    return success({ ok: true, message: "Member permission revoked" });
  } catch (err) {
    console.error("Revoke permission error:", err);
    return internalError();
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
