/**
 * GET /api/calendar/visibility/[calendarId]
 * Get calendar visibility settings
 *
 * PUT /api/calendar/visibility/[calendarId]
 * Update calendar visibility (captain+ only)
 *
 * Response: { visibility, selectedMembers, currentUserPermissions }
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
import {
  invalidateCalendarEventCache,
  cascadeVisibilityChange,
} from "@/lib/api/calendar-cascade";

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

    // Get calendar visibility
    const { data: calendar } = await supabase
      .from("calendar_configs")
      .select("id, visibility")
      .eq("id", calendarId)
      .eq("organization_id", orgId!)
      .maybeSingle();

    if (!calendar) {
      return notFound("Calendar not found");
    }

    // Get user's permissions on this calendar
    const { data: userPerms } = await supabase
      .from("calendar_member_permissions")
      .select("*")
      .eq("calendar_id", calendarId)
      .eq("member_user_id", user!.id)
      .maybeSingle();

    // Get selected members if visibility is "selected-members"
    let selectedMembers: unknown[] = [];
    if (calendar.visibility === "selected-members") {
      const { data: perms } = await supabase
        .from("calendar_member_permissions")
        .select(
          `
          member_user_id,
          profiles:member_user_id (
            id,
            display_name,
            avatar_url
          )
        `,
        )
        .eq("calendar_id", calendarId)
        .eq("can_view", true)
        .is("deleted_at", null);

      selectedMembers = perms || [];
    }

    return success({
      visibility: calendar.visibility,
      selectedMembers,
      currentUserPermissions: userPerms,
    });
  } catch (err) {
    console.error("Calendar visibility GET error:", err);
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

    const { visibility, selectedMemberIds } = body;

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

    // Get current calendar state for audit
    const { data: currentCalendar } = await admin
      .from("calendar_configs")
      .select("id, visibility, organization_id")
      .eq("id", calendarId)
      .eq("organization_id", orgId!)
      .maybeSingle();

    if (!currentCalendar) {
      return notFound("Calendar not found");
    }

    // Update calendar visibility
    const { error: updateError } = await admin
      .from("calendar_configs")
      .update({
        visibility,
        updated_at: new Date().toISOString(),
        updated_by: user!.id,
      })
      .eq("id", calendarId);

    if (updateError) {
      console.error("Update error:", updateError);
      return internalError();
    }

    // If visibility is "selected-members", update member permissions
    if (visibility === "selected-members" && Array.isArray(selectedMemberIds)) {
      // Get current members with view access
      const { data: currentMembers } = await admin
        .from("calendar_member_permissions")
        .select("member_user_id")
        .eq("calendar_id", calendarId)
        .eq("can_view", true)
        .is("deleted_at", null);

      const currentMemberIds = new Set(
        currentMembers?.map((m) => m.member_user_id) || [],
      );
      const selectedSet = new Set(selectedMemberIds);

      // Remove access from members not in selected list
      for (const memberId of currentMemberIds) {
        if (!selectedSet.has(memberId)) {
          await admin
            .from("calendar_member_permissions")
            .update({
              can_view: false,
              updated_by: user!.id,
              updated_at: new Date().toISOString(),
            })
            .eq("calendar_id", calendarId)
            .eq("member_user_id", memberId);
        }
      }

      // Add access to selected members
      for (const memberId of selectedMemberIds) {
        if (typeof memberId !== "string" || !isValidUUID(memberId)) continue;

        // Upsert permission
        await admin
          .from("calendar_member_permissions")
          .upsert(
            {
              calendar_id: calendarId,
              member_user_id: memberId,
              organization_id: orgId!,
              can_view: true,
              can_create_event: false,
              can_edit_event: false,
              can_delete_event: false,
              can_manage_permissions: false,
              created_by: user!.id,
              updated_by: user!.id,
            },
            {
              onConflict: "calendar_id,member_user_id",
            },
          );
      }
    }

    // Cascade visibility change (audit log, cache invalidation, notifications)
    await cascadeVisibilityChange(
      calendarId,
      currentCalendar.visibility,
      visibility,
      user!.id,
      Array.isArray(selectedMemberIds) ? selectedMemberIds : undefined,
    );

    // Invalidate event cache
    await invalidateCalendarEventCache(calendarId);

    return success({
      ok: true,
      message: "Calendar visibility updated",
    });
  } catch (err) {
    console.error("Calendar visibility PUT error:", err);
    return internalError();
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
