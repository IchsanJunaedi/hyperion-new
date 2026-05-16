"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logCalendarAudit } from "@/lib/permissions/calendar-audit";

import {
  setEventVisibilitySchema,
  resetEventVisibilitySchema,
} from "@/lib/validations/calendar-permissions";

import type { EventVisibility } from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ActionResult<T = void> {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}

export interface EventVisibilityResult {
  visibility: EventVisibility;
}

// ============================================================================
// Set Event Visibility
// ============================================================================

/**
 * Set event-level visibility override.
 * Allows specific event to have different visibility than its calendar.
 * Creator+ only.
 *
 * @param orgSlug - Organization slug
 * @param raw - Raw input data to validate
 * @returns Action result with visibility settings
 */
export async function setEventVisibilityAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionResult<EventVisibilityResult>> {
  const parsed = setEventVisibilitySchema.safeParse(raw);
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

  // Get event
  const { data: event } = await supabase
    .from("calendar_events")
    .select("id, created_by")
    .eq("id", parsed.data.eventId)
    .eq("organization_id", org.id)
    .single();

  if (!event) {
    return { ok: false, message: "Event tidak ditemukan" };
  }

  // Check permission: only creator can set event visibility
  if (user.id !== event.created_by) {
    const role = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", org.id)
      .single();

    if (!role.data || !["owner", "manager", "coach"].includes(role.data.role)) {
      return {
        ok: false,
        message:
          "Anda tidak memiliki akses untuk mengubah visibilitas event ini",
      };
    }
  }

  // Check if event visibility record exists
  const { data: existing } = await supabase
    .from("event_visibility")
    .select("*")
    .eq("event_id", parsed.data.eventId)
    .eq("organization_id", org.id)
    .single();

  if (existing && parsed.data.visibility === undefined) {
    // If no visibility specified and record exists, just return it
    return {
      ok: true,
      data: { visibility: existing },
    };
  }

  if (existing) {
    // Update existing visibility record
    const { data: updated, error } = await supabase
      .from("event_visibility")
      .update({
        visibility: parsed.data.visibility,
        allowed_member_ids: parsed.data.allowedMemberIds ?? [],
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !updated) {
      return {
        ok: false,
        message: error?.message ?? "Gagal mengubah visibilitas event",
      };
    }

    // Audit log
    await logCalendarAudit(
      org.id,
      "event_visibility_changed",
      "event",
      parsed.data.eventId,
      user.id,
      {
        visibility: {
          old_value: existing.visibility,
          new_value: parsed.data.visibility,
        },
      },
      {
        allowedMembersCount: parsed.data.allowedMemberIds?.length ?? 0,
      },
    );

    revalidatePath(`/${orgSlug}`);

    return {
      ok: true,
      data: { visibility: updated },
    };
  }

  if (!parsed.data.visibility) {
    return {
      ok: false,
      message: "Visibilitas harus ditentukan untuk event baru",
    };
  }

  // Create new visibility record
  const { data: newVisibility, error: createError } = await supabase
    .from("event_visibility")
    .insert({
      organization_id: org.id,
      event_id: parsed.data.eventId,
      visibility: parsed.data.visibility,
      allowed_member_ids: parsed.data.allowedMemberIds ?? [],
      created_by: user.id,
    })
    .select("*")
    .single();

  if (createError || !newVisibility) {
    return {
      ok: false,
      message:
        createError?.message ?? "Gagal membuat pengaturan visibilitas event",
    };
  }

  // Audit log
  await logCalendarAudit(
    org.id,
    "event_visibility_changed",
    "event",
    parsed.data.eventId,
    user.id,
    {},
    {
      visibility: parsed.data.visibility,
      allowedMembersCount: parsed.data.allowedMemberIds?.length ?? 0,
    },
  );

  revalidatePath(`/${orgSlug}`);

  return {
    ok: true,
    data: { visibility: newVisibility },
  };
}

// ============================================================================
// Get Event Visibility
// ============================================================================

/**
 * Get event visibility settings.
 * Returns the override if set, otherwise returns null.
 *
 * @param orgSlug - Organization slug
 * @param eventId - Event ID
 * @returns Action result with visibility settings
 */
export async function getEventVisibilityAction(
  orgSlug: string,
  eventId: string,
): Promise<ActionResult<EventVisibilityResult>> {
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

  // Get event
  const { data: event } = await supabase
    .from("calendar_events")
    .select("id")
    .eq("id", eventId)
    .eq("organization_id", org.id)
    .single();

  if (!event) {
    return { ok: false, message: "Event tidak ditemukan" };
  }

  // Get event visibility
  const { data: visibility } = await supabase
    .from("event_visibility")
    .select("*")
    .eq("event_id", eventId)
    .eq("organization_id", org.id)
    .single();

  if (!visibility) {
    return {
      ok: false,
      message: "Pengaturan visibilitas tidak ditemukan untuk event ini",
    };
  }

  return {
    ok: true,
    data: { visibility },
  };
}

// ============================================================================
// Reset Event Visibility to Calendar Default
// ============================================================================

/**
 * Reset event visibility to calendar default (soft delete visibility override).
 * Creator+ only.
 *
 * @param orgSlug - Organization slug
 * @param raw - Raw input data to validate
 * @returns Action result
 */
export async function resetEventVisibilityAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = resetEventVisibilitySchema.safeParse(raw);
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

  // Get event
  const { data: event } = await supabase
    .from("calendar_events")
    .select("id, created_by")
    .eq("id", parsed.data.eventId)
    .eq("organization_id", org.id)
    .single();

  if (!event) {
    return { ok: false, message: "Event tidak ditemukan" };
  }

  // Check permission: only creator can reset
  if (user.id !== event.created_by) {
    const role = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", org.id)
      .single();

    if (!role.data || !["owner", "manager", "coach"].includes(role.data.role)) {
      return {
        ok: false,
        message:
          "Anda tidak memiliki akses untuk mereset visibilitas event ini",
      };
    }
  }

  // Get event visibility record
  const { data: visibility } = await supabase
    .from("event_visibility")
    .select("*")
    .eq("event_id", parsed.data.eventId)
    .eq("organization_id", org.id)
    .single();

  if (!visibility) {
    return {
      ok: false,
      message: "Pengaturan visibilitas tidak ditemukan untuk event ini",
    };
  }

  // Soft delete the visibility override (set deleted_at)
  const { error } = await supabase
    .from("event_visibility")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", visibility.id);

  if (error) {
    return {
      ok: false,
      message: error.message ?? "Gagal mereset visibilitas event",
    };
  }

  // Audit log
  await logCalendarAudit(
    org.id,
    "event_visibility_changed",
    "event",
    parsed.data.eventId,
    user.id,
    { deleted_at: new Date().toISOString() },
    {
      action: "reset_to_calendar_default",
      previousVisibility: visibility.visibility,
    },
  );

  revalidatePath(`/${orgSlug}`);

  return { ok: true };
}
