"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logCalendarAudit } from "@/lib/permissions/calendar-audit";
import { checkCalendarPermission } from "@/lib/permissions/calendar-access";

import {
  createCalendarSchema,
  updateCalendarSchema,
  setCalendarVisibilitySchema,
} from "@/lib/validations/calendar-permissions";

import type { CalendarConfig } from "@/lib/permissions/calendar-types";
import type { Database } from "@/types/database";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ActionResult<T = void> {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}

export interface CalendarResult {
  calendar: CalendarConfig;
}

// ============================================================================
// Create Calendar
// ============================================================================

/**
 * Create a new calendar. Manager+ only.
 *
 * @param orgSlug - Organization slug
 * @param raw - Raw input data to validate
 * @returns Action result with created calendar
 */
export async function createCalendarAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionResult<CalendarResult>> {
  const parsed = createCalendarSchema.safeParse(raw);
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
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (orgError || !org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  // Check permission: manager+ can create calendars
  const permission = await checkCalendarPermission(
    user.id,
    org.id,
    "manage-calendar",
    org.id,
  );

  if (!permission.allowed) {
    return {
      ok: false,
      message:
        permission.reason ?? "Anda tidak memiliki akses untuk membuat kalender",
    };
  }

  // Create calendar
  const { data: calendar, error: createError } = await supabase
    .from("calendar_configs")
    .insert({
      organization_id: org.id,
      created_by: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
      is_active: true,
    })
    .select("*")
    .single();

  if (createError || !calendar) {
    return {
      ok: false,
      message: createError?.message ?? "Gagal membuat kalender",
    };
  }

  // Grant selected member permissions if visibility = selected-members
  if (
    parsed.data.visibility === "selected-members" &&
    parsed.data.selectedMemberIds.length > 0
  ) {
    const permissions = parsed.data.selectedMemberIds.map((memberId) => ({
      organization_id: org.id,
      calendar_id: calendar.id,
      member_user_id: memberId,
      can_view: true,
      can_create_event: false,
      can_edit_event: false,
      can_delete_event: false,
      can_manage_permissions: false,
      created_by: user.id,
    }));

    const { error: permError } = await supabase
      .from("calendar_member_permissions")
      .insert(permissions);

    if (permError) {
      console.error("Failed to grant initial permissions:", permError);
      // Non-blocking: calendar was created, just permissions failed
    }
  }

  // Audit log
  await logCalendarAudit(
    org.id,
    "calendar_created",
    "calendar",
    calendar.id,
    user.id,
    {},
    {
      title: calendar.title,
      visibility: calendar.visibility,
      selectedMembersCount: parsed.data.selectedMemberIds.length,
    },
  );

  revalidatePath(`/${orgSlug}`);

  return {
    ok: true,
    data: { calendar: calendar as unknown as CalendarConfig },
  };
}

// ============================================================================
// Update Calendar
// ============================================================================

/**
 * Update calendar properties. Creator+ only.
 *
 * @param orgSlug - Organization slug
 * @param raw - Raw input data to validate
 * @returns Action result
 */
export async function updateCalendarAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = updateCalendarSchema.safeParse(raw);
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

  // Get organization and calendar
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (!org) {
    return { ok: false, message: "Organisasi tidak ditemukan" };
  }

  const { data: calendar } = await supabase
    .from("calendar_configs")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("organization_id", org.id)
    .single();

  if (!calendar) {
    return { ok: false, message: "Kalender tidak ditemukan" };
  }

  // Check permission: creator or manager+ can edit
  const permission = await checkCalendarPermission(
    user.id,
    parsed.data.id,
    "manage-calendar",
    org.id,
  );

  if (!permission.allowed) {
    return {
      ok: false,
      message:
        permission.reason ??
        "Anda tidak memiliki akses untuk mengubah kalender ini",
    };
  }

  // Prepare updates
  const updates: { title?: string; description?: string | null; visibility?: string; is_active?: boolean; updated_at?: string; updated_by?: string | null } = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined)
    updates.description = parsed.data.description;
  if (parsed.data.visibility !== undefined)
    updates.visibility = parsed.data.visibility;
  if (parsed.data.isActive !== undefined)
    updates.is_active = parsed.data.isActive;

  if (Object.keys(updates).length === 0) {
    return { ok: true };
  }

  updates.updated_at = new Date().toISOString();
  updates.updated_by = user.id;

  // Update calendar
  const { error: updateError } = await supabase
    .from("calendar_configs")
    .update(updates)
    .eq("id", parsed.data.id);

  if (updateError) {
    return {
      ok: false,
      message: updateError.message ?? "Gagal mengubah kalender",
    };
  }

  // Log audit
  await logCalendarAudit(
    org.id,
    "calendar_updated",
    "calendar",
    parsed.data.id,
    user.id,
    Object.entries(updates).reduce(
      (acc, [key, newValue]) => {
        const oldValue = calendar[key as keyof typeof calendar];
        if (oldValue !== newValue) {
          acc[key] = { old_value: oldValue, new_value: newValue };
        }
        return acc;
      },
      {} as Record<string, { old_value?: unknown; new_value?: unknown }>,
    ),
  );

  revalidatePath(`/${orgSlug}`);

  return { ok: true };
}

// ============================================================================
// Delete Calendar (Soft Delete)
// ============================================================================

/**
 * Soft delete a calendar. Creator+ only.
 *
 * @param orgSlug - Organization slug
 * @param calendarId - Calendar ID
 * @returns Action result
 */
export async function deleteCalendarAction(
  orgSlug: string,
  calendarId: string,
): Promise<ActionResult> {
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

  // Check permission
  const permission = await checkCalendarPermission(
    user.id,
    calendarId,
    "manage-calendar",
    org.id,
  );

  if (!permission.allowed) {
    return {
      ok: false,
      message:
        permission.reason ??
        "Anda tidak memiliki akses untuk menghapus kalender ini",
    };
  }

  // Soft delete
  const { error } = await supabase
    .from("calendar_configs")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", calendarId);

  if (error) {
    return {
      ok: false,
      message: error.message ?? "Gagal menghapus kalender",
    };
  }

  // Audit log
  await logCalendarAudit(
    org.id,
    "calendar_deleted",
    "calendar",
    calendarId,
    user.id,
    { deleted_at: { new_value: new Date().toISOString() } },
  );

  revalidatePath(`/${orgSlug}`);

  return { ok: true };
}

// ============================================================================
// Restore Deleted Calendar
// ============================================================================

/**
 * Restore a soft-deleted calendar. Creator+ only.
 *
 * @param orgSlug - Organization slug
 * @param calendarId - Calendar ID
 * @returns Action result
 */
export async function restoreCalendarAction(
  orgSlug: string,
  calendarId: string,
): Promise<ActionResult> {
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

  // Get deleted calendar
  const { data: calendar } = await supabase
    .from("calendar_configs")
    .select("*")
    .eq("id", calendarId)
    .eq("organization_id", org.id)
    .not("deleted_at", "is", null)
    .single();

  if (!calendar) {
    return {
      ok: false,
      message: "Kalender tidak ditemukan atau tidak terhapus",
    };
  }

  // Check permission (check against original creator)
  if (user.id !== calendar.created_by) {
    const role = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", org.id)
      .single();

    if (!role.data || !["owner", "manager"].includes(role.data.role)) {
      return {
        ok: false,
        message: "Anda tidak memiliki akses untuk memulihkan kalender ini",
      };
    }
  }

  // Restore
  const { error } = await supabase
    .from("calendar_configs")
    .update({
      deleted_at: null,
      updated_by: user.id,
    })
    .eq("id", calendarId);

  if (error) {
    return {
      ok: false,
      message: error.message ?? "Gagal memulihkan kalender",
    };
  }

  // Audit log
  await logCalendarAudit(
    org.id,
    "calendar_updated",
    "calendar",
    calendarId,
    user.id,
    { deleted_at: { old_value: calendar.deleted_at, new_value: null } },
    { action: "restore" },
  );

  revalidatePath(`/${orgSlug}`);

  return { ok: true };
}

// ============================================================================
// Set Calendar Visibility
// ============================================================================

/**
 * Set calendar visibility and manage selected members.
 * Updates visibility and handles member permission changes.
 *
 * @param orgSlug - Organization slug
 * @param raw - Raw input data to validate
 * @returns Action result
 */
export async function setCalendarVisibilityAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = setCalendarVisibilitySchema.safeParse(raw);
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

  // Check permission
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
        "Anda tidak memiliki akses untuk mengubah visibilitas kalender",
    };
  }

  // Update visibility
  const { error: updateError } = await supabase
    .from("calendar_configs")
    .update({
      visibility: parsed.data.visibility,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", parsed.data.calendarId);

  if (updateError) {
    return {
      ok: false,
      message: updateError.message ?? "Gagal mengubah visibilitas kalender",
    };
  }

  // If visibility = selected-members, manage member permissions
  if (parsed.data.visibility === "selected-members") {
    // Remove all existing permissions
    await supabase
      .from("calendar_member_permissions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("calendar_id", parsed.data.calendarId);

    // Add new permissions for selected members
    if (parsed.data.selectedMemberIds.length > 0) {
      const permissions = parsed.data.selectedMemberIds.map((memberId) => ({
        organization_id: org.id,
        calendar_id: parsed.data.calendarId,
        member_user_id: memberId,
        can_view: true,
        can_create_event: false,
        can_edit_event: false,
        can_delete_event: false,
        can_manage_permissions: false,
        created_by: user.id,
      }));

      const { error: permError } = await supabase
        .from("calendar_member_permissions")
        .insert(permissions);

      if (permError) {
        console.error("Failed to update member permissions:", permError);
      }
    }
  }

  // Audit log
  await logCalendarAudit(
    org.id,
    "calendar_updated",
    "calendar",
    parsed.data.calendarId,
    user.id,
    {
      visibility: {
        old_value: calendar.visibility,
        new_value: parsed.data.visibility,
      },
    },
    {
      selectedMembersCount: parsed.data.selectedMemberIds.length,
    },
  );

  revalidatePath(`/${orgSlug}`);

  return { ok: true };
}
