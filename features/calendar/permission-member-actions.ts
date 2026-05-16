"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logCalendarAudit } from "@/lib/permissions/calendar-audit";
import { checkCalendarPermission } from "@/lib/permissions/calendar-access";

import {
  grantMemberPermissionSchema,
  revokeMemberPermissionSchema,
  bulkGrantPermissionsSchema,
} from "@/lib/validations/calendar-permissions";

import type { CalendarMemberPermission } from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ActionResult<T = void> {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}

export interface MemberPermissionResult {
  permission: CalendarMemberPermission;
}

export interface CalendarMemberWithProfile extends CalendarMemberPermission {
  member: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface MembersResult {
  members: CalendarMemberWithProfile[];
}

// ============================================================================
// Grant Member Permission
// ============================================================================

/**
 * Grant explicit permission to a member for a calendar.
 * Manager+ only (or calendar creator).
 *
 * @param orgSlug - Organization slug
 * @param raw - Raw input data to validate
 * @returns Action result with created permission
 */
export async function grantMemberPermissionAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionResult<MemberPermissionResult>> {
  const parsed = grantMemberPermissionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Data tidak valid",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login terlebih dahulu" };
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  // Get calendar
  const { data: calendar } = await supabase
    .from("calendar_configs")
    .select("*")
    .eq("id", parsed.data.calendarId)
    .eq("organization_id", org.id)
    .single();

  if (!calendar) {
    return { ok: false, message: "Kalender tidak ditemukan" };
  }

  // Check permission to manage permissions
  const permission = await checkCalendarPermission(
    user.id,
    parsed.data.calendarId,
    "manage-permissions",
    org.id,
  );

  if (!permission.allowed) {
    return {
      ok: false,
      message:
        permission.reason ??
        "Anda tidak memiliki akses untuk mengubah izin kalender",
    };
  }

  // Check if member exists in organization
  const { data: member } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", parsed.data.memberUserId)
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .single();

  if (!member) {
    return {
      ok: false,
      message: "Member tidak ditemukan atau tidak aktif di organisasi ini",
    };
  }

  // Check if permission already exists
  const { data: existing } = await supabase
    .from("calendar_member_permissions")
    .select("*")
    .eq("calendar_id", parsed.data.calendarId)
    .eq("member_user_id", parsed.data.memberUserId)
    .eq("deleted_at", null)
    .single();

  if (existing) {
    // Update existing permission
    const { data: updated, error } = await supabase
      .from("calendar_member_permissions")
      .update({
        can_view: parsed.data.canView,
        can_create_event: parsed.data.canCreateEvent,
        can_edit_event: parsed.data.canEditEvent,
        can_delete_event: parsed.data.canDeleteEvent,
        can_manage_permissions: parsed.data.canManagePermissions,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !updated) {
      return {
        ok: false,
        message: error?.message ?? "Gagal memperbarui izin member",
      };
    }

    // Audit log
    await logCalendarAudit(
      org.id,
      "permission_updated",
      "permission",
      existing.id,
      user.id,
      {
        can_view: {
          old_value: existing.can_view,
          new_value: parsed.data.canView,
        },
        can_create_event: {
          old_value: existing.can_create_event,
          new_value: parsed.data.canCreateEvent,
        },
        can_edit_event: {
          old_value: existing.can_edit_event,
          new_value: parsed.data.canEditEvent,
        },
        can_delete_event: {
          old_value: existing.can_delete_event,
          new_value: parsed.data.canDeleteEvent,
        },
        can_manage_permissions: {
          old_value: existing.can_manage_permissions,
          new_value: parsed.data.canManagePermissions,
        },
      },
      {
        calendar_id: parsed.data.calendarId,
        member_user_id: parsed.data.memberUserId,
      },
    );

    revalidatePath(`/${orgSlug}`);

    return {
      ok: true,
      data: { permission: updated },
    };
  }

  // Create new permission
  const { data: newPermission, error: createError } = await supabase
    .from("calendar_member_permissions")
    .insert({
      organization_id: org.id,
      calendar_id: parsed.data.calendarId,
      member_user_id: parsed.data.memberUserId,
      can_view: parsed.data.canView,
      can_create_event: parsed.data.canCreateEvent,
      can_edit_event: parsed.data.canEditEvent,
      can_delete_event: parsed.data.canDeleteEvent,
      can_manage_permissions: parsed.data.canManagePermissions,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (createError || !newPermission) {
    return {
      ok: false,
      message: createError?.message ?? "Gagal memberikan izin ke member",
    };
  }

  // Audit log
  await logCalendarAudit(
    org.id,
    "permission_granted",
    "permission",
    newPermission.id,
    user.id,
    {},
    {
      calendar_id: parsed.data.calendarId,
      member_user_id: parsed.data.memberUserId,
      permissions: {
        canView: parsed.data.canView,
        canCreateEvent: parsed.data.canCreateEvent,
        canEditEvent: parsed.data.canEditEvent,
        canDeleteEvent: parsed.data.canDeleteEvent,
        canManagePermissions: parsed.data.canManagePermissions,
      },
    },
  );

  revalidatePath(`/${orgSlug}`);

  return {
    ok: true,
    data: { permission: newPermission },
  };
}

// ============================================================================
// Revoke Member Permission
// ============================================================================

/**
 * Revoke permission from a member for a calendar (soft delete).
 * Manager+ only (or calendar creator).
 *
 * @param orgSlug - Organization slug
 * @param raw - Raw input data to validate
 * @returns Action result
 */
export async function revokeMemberPermissionAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = revokeMemberPermissionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Data tidak valid",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login terlebih dahulu" };
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  // Get calendar
  const { data: calendar } = await supabase
    .from("calendar_configs")
    .select("*")
    .eq("id", parsed.data.calendarId)
    .eq("organization_id", org.id)
    .single();

  if (!calendar) {
    return { ok: false, message: "Kalender tidak ditemukan" };
  }

  // Check permission to manage permissions
  const permission = await checkCalendarPermission(
    user.id,
    parsed.data.calendarId,
    "manage-permissions",
    org.id,
  );

  if (!permission.allowed) {
    return {
      ok: false,
      message:
        permission.reason ??
        "Anda tidak memiliki akses untuk mencabut izin kalender",
    };
  }

  // Get permission to revoke
  const { data: permissionRecord } = await supabase
    .from("calendar_member_permissions")
    .select("*")
    .eq("calendar_id", parsed.data.calendarId)
    .eq("member_user_id", parsed.data.memberUserId)
    .eq("deleted_at", null)
    .single();

  if (!permissionRecord) {
    return { ok: false, message: "Izin tidak ditemukan" };
  }

  // Soft delete the permission
  const { error } = await supabase
    .from("calendar_member_permissions")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", permissionRecord.id);

  if (error) {
    return {
      ok: false,
      message: error.message ?? "Gagal mencabut izin member",
    };
  }

  // Audit log
  await logCalendarAudit(
    org.id,
    "permission_revoked",
    "permission",
    permissionRecord.id,
    user.id,
    {},
    {
      calendar_id: parsed.data.calendarId,
      member_user_id: parsed.data.memberUserId,
    },
  );

  revalidatePath(`/${orgSlug}`);

  return { ok: true };
}

// ============================================================================
// Bulk Grant Permissions
// ============================================================================

/**
 * Grant permissions to multiple members at once.
 * Manager+ only.
 *
 * @param orgSlug - Organization slug
 * @param raw - Raw input data to validate
 * @returns Action result
 */
export async function bulkGrantPermissionsAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = bulkGrantPermissionsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Data tidak valid",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login terlebih dahulu" };
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  // Get calendar
  const { data: calendar } = await supabase
    .from("calendar_configs")
    .select("*")
    .eq("id", parsed.data.calendarId)
    .eq("organization_id", org.id)
    .single();

  if (!calendar) {
    return { ok: false, message: "Kalender tidak ditemukan" };
  }

  // Check permission to manage permissions
  const permission = await checkCalendarPermission(
    user.id,
    parsed.data.calendarId,
    "manage-permissions",
    org.id,
  );

  if (!permission.allowed) {
    return {
      ok: false,
      message:
        permission.reason ??
        "Anda tidak memiliki akses untuk mengelola izin kalender",
    };
  }

  // Verify all members exist in organization
  const { data: members } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .in("user_id", parsed.data.memberIds);

  if (!members || members.length !== parsed.data.memberIds.length) {
    return {
      ok: false,
      message: "Beberapa member tidak ditemukan atau tidak aktif",
    };
  }

  // Prepare permission records
  const permissionRecords = parsed.data.memberIds.map((memberId) => ({
    organization_id: org.id,
    calendar_id: parsed.data.calendarId,
    member_user_id: memberId,
    can_view: parsed.data.permissions.canView ?? true,
    can_create_event: parsed.data.permissions.canCreateEvent ?? false,
    can_edit_event: parsed.data.permissions.canEditEvent ?? false,
    can_delete_event: parsed.data.permissions.canDeleteEvent ?? false,
    can_manage_permissions:
      parsed.data.permissions.canManagePermissions ?? false,
    created_by: user.id,
  }));

  // Use upsert to handle existing permissions
  const { error } = await supabase
    .from("calendar_member_permissions")
    .upsert(permissionRecords, {
      onConflict: "calendar_id,member_user_id",
    });

  if (error) {
    return {
      ok: false,
      message: error.message ?? "Gagal memberikan izin ke member",
    };
  }

  // Audit log
  await logCalendarAudit(
    org.id,
    "permission_granted",
    "permission",
    null,
    user.id,
    {},
    {
      calendar_id: parsed.data.calendarId,
      member_count: parsed.data.memberIds.length,
      permissions: parsed.data.permissions,
    },
  );

  revalidatePath(`/${orgSlug}`);

  return { ok: true };
}

// ============================================================================
// Get Calendar Members with Permissions
// ============================================================================

/**
 * Get all members with explicit permissions for a calendar.
 *
 * @param orgSlug - Organization slug
 * @param calendarId - Calendar ID
 * @returns Action result with members list
 */
export async function getCalendarMembersAction(
  orgSlug: string,
  calendarId: string,
): Promise<ActionResult<MembersResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login terlebih dahulu" };
  }

  // Get organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  // Get calendar
  const { data: calendar } = await supabase
    .from("calendar_configs")
    .select("*")
    .eq("id", calendarId)
    .eq("organization_id", org.id)
    .single();

  if (!calendar) {
    return { ok: false, message: "Kalender tidak ditemukan" };
  }

  // Check permission to view members
  const permission = await checkCalendarPermission(
    user.id,
    calendarId,
    "manage-permissions",
    org.id,
  );

  if (!permission.allowed) {
    return {
      ok: false,
      message:
        permission.reason ??
        "Anda tidak memiliki akses untuk melihat izin kalender",
    };
  }

  // Get permissions with member profiles
  const { data: memberPermissions, error } = await supabase
    .from("calendar_member_permissions")
    .select(
      `
        *,
        member:member_user_id(id, username, display_name, avatar_url)
      `,
    )
    .eq("calendar_id", calendarId)
    .eq("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      ok: false,
      message: error.message ?? "Gagal mengambil daftar member",
    };
  }

  return {
    ok: true,
    data: {
      members: (memberPermissions ?? []) as CalendarMemberWithProfile[],
    },
  };
}
