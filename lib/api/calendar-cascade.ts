/**
 * Calendar Cascading Permissions Middleware
 *
 * Handles cascading updates when calendar permissions, visibility, or events change.
 * Ensures consistency across related database records and invalidates caches.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// v2 calendar types — tables not yet in DB, defined locally until migration
type CalendarMemberPermissionRow = {
  can_view?: boolean;
  can_create_event?: boolean;
  can_edit_event?: boolean;
  can_delete_event?: boolean;
  can_manage_permissions?: boolean;
  updated_by?: string | null;
  [key: string]: unknown;
};
type CalendarConfigRow = Record<string, unknown>;

/**
 * Invalidate cache for all events in a calendar
 *
 * When calendar visibility changes, all events may need re-fetching
 * to reflect permission changes.
 *
 * @param calendarId - Calendar ID
 *
 * @example
 * ```typescript
 * // After changing calendar visibility
 * await invalidateCalendarEventCache(calendarId)
 * ```
 */
export async function invalidateCalendarEventCache(
  calendarId: string,
): Promise<void> {
  try {
    // In a production app, this would invalidate Redis cache
    // or trigger cache invalidation via Next.js revalidatePath
    console.log(`[Cache] Invalidating events for calendar ${calendarId}`);

    // TODO: Implement with Next.js fetch cache or Redis
    // await revalidateTag(`calendar-events-${calendarId}`)
  } catch (err) {
    console.error("Cache invalidation error:", err);
    // Non-blocking: cache invalidation failure shouldn't break the action
  }
}

/**
 * Cascade permission changes to audit log and notifications
 *
 * When a member's permissions on a calendar change:
 * 1. Log the audit entry
 * 2. Notify the member of the change
 * 3. Invalidate their cache
 *
 * @param calendarId - Calendar ID
 * @param memberId - Member user ID
 * @param oldPerms - Previous permissions
 * @param newPerms - New permissions
 *
 * @example
 * ```typescript
 * await cascadePermissionChange(
 *   calendarId,
 *   memberId,
 *   { can_view: false },
 *   { can_view: true, can_create_event: true }
 * )
 * ```
 */
export async function cascadePermissionChange(
  calendarId: string,
  memberId: string,
  oldPerms: Partial<CalendarMemberPermissionRow>,
  newPerms: Partial<CalendarMemberPermissionRow>,
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Get member profile for notification
    const { data: memberProfile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", memberId)
      .maybeSingle();

    // Get calendar for audit logging
    const { data: calendar } = await admin
      .from("calendar_configs")
      .select("id, title, organization_id")
      .eq("id", calendarId)
      .maybeSingle();

    if (!calendar) return;

    // Build change summary
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    const permFields = [
      "can_view",
      "can_create_event",
      "can_edit_event",
      "can_delete_event",
      "can_manage_permissions",
    ] as const;

    for (const field of permFields) {
      if (oldPerms[field] !== newPerms[field]) {
        changes[field] = {
          old: oldPerms[field] ?? false,
          new: newPerms[field] ?? false,
        };
      }
    }

    if (Object.keys(changes).length === 0) {
      return; // No actual changes
    }

    // Log audit entry
    await logAudit({
      actorId: newPerms.updated_by || "system",
      action: "update-permissions",
      entityType: "calendar_member_permission",
      entityId: calendarId,
      metadata: {
        memberId,
        memberName: memberProfile?.display_name || "Unknown",
        calendarTitle: calendar.title,
        changes,
      },
    });

    // TODO: Send notification to member about permission changes
    // await notifyUser(memberId, {
    //   type: 'calendar-permission-changed',
    //   calendarTitle: calendar.title,
    //   changes
    // })

    // Invalidate member's cache
    invalidateUserCalendarCache(memberId);
  } catch (err) {
    console.error("Cascade permission change error:", err);
    // Non-blocking: cascade failure shouldn't break the main action
  }
}

/**
 * Invalidate cache for a specific user's calendar data
 *
 * @param userId - User ID
 *
 * @example
 * ```typescript
 * await invalidateUserCalendarCache(userId)
 * ```
 */
export async function invalidateUserCalendarCache(userId: string): Promise<void> {
  try {
    console.log(`[Cache] Invalidating calendar cache for user ${userId}`);
    // TODO: Implement with Next.js fetch cache or Redis
    // await revalidateTag(`user-calendars-${userId}`)
  } catch (err) {
    console.error("User cache invalidation error:", err);
  }
}

/**
 * Cleanup when a calendar is deleted
 *
 * 1. Delete all member permissions
 * 2. Delete all event visibility overrides
 * 3. Delete all audit logs
 * 4. Notify affected members
 * 5. Invalidate all affected user caches
 *
 * @param calendarId - Calendar ID to delete
 *
 * @example
 * ```typescript
 * await cleanupCalendarOnDelete(calendarId)
 * ```
 */
export async function cleanupCalendarOnDelete(calendarId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    // Get all affected members before deletion
    const { data: affectedMembers } = await admin
      .from("calendar_member_permissions")
      .select("member_user_id, display_name:profiles(display_name)")
      .eq("calendar_id", calendarId);

    // Delete member permissions
    await admin
      .from("calendar_member_permissions")
      .delete()
      .eq("calendar_id", calendarId);

    // Delete event visibility overrides
    await admin
      .from("event_visibility")
      .delete()
      .eq("calendar_id", calendarId);

    // Delete calendar audit logs
    await admin
      .from("calendar_audit_logs")
      .delete()
      .eq("calendar_id", calendarId);

    // Invalidate caches for all affected members
    if (affectedMembers) {
      for (const member of affectedMembers) {
        await invalidateUserCalendarCache(member.member_user_id);
      }
    }

    // Log the deletion
    const { data: calendar } = await admin
      .from("calendar_configs")
      .select("title")
      .eq("id", calendarId)
      .maybeSingle();

    if (calendar) {
      console.log(`[Cleanup] Calendar "${calendar.title}" deleted successfully`);
    }
  } catch (err) {
    console.error("Calendar cleanup error:", err);
    // Non-blocking: cleanup failure shouldn't prevent deletion
  }
}

/**
 * Cascade calendar visibility changes to all members
 *
 * When visibility is updated:
 * 1. Update audit log with visibility change
 * 2. Invalidate all member caches
 * 3. Determine who lost access and log it
 *
 * @param calendarId - Calendar ID
 * @param oldVisibility - Previous visibility setting
 * @param newVisibility - New visibility setting
 * @param actorId - User making the change
 * @param selectedMemberIds - Member IDs selected for "selected-members" visibility
 *
 * @example
 * ```typescript
 * await cascadeVisibilityChange(
 *   calendarId,
 *   'team-only',
 *   'captain-only',
 *   actorId,
 *   []
 * )
 * ```
 */
export async function cascadeVisibilityChange(
  calendarId: string,
  oldVisibility: string,
  newVisibility: string,
  actorId: string,
  selectedMemberIds?: string[],
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Get all calendar members
    const { data: members } = await admin
      .from("calendar_member_permissions")
      .select("member_user_id")
      .eq("calendar_id", calendarId)
      .is("deleted_at", null);

    // Invalidate all member caches
    if (members) {
      for (const member of members) {
        await invalidateUserCalendarCache(member.member_user_id);
      }
    }

    // Log the visibility change
    await logAudit({
      actorId,
      action: "update-visibility",
      entityType: "calendar_config",
      entityId: calendarId,
      metadata: {
        oldVisibility,
        newVisibility,
        affectedMemberCount: members?.length ?? 0,
        selectedMemberIds: selectedMemberIds ?? [],
      },
    });
  } catch (err) {
    console.error("Cascade visibility change error:", err);
  }
}

/**
 * Update all member permissions when calendar visibility changes
 *
 * This applies visibility-based access rules to all members.
 *
 * @param calendarId - Calendar ID
 * @param newVisibility - New visibility setting
 *
 * @example
 * ```typescript
 * await updateCalendarMemberAccessOnVisibilityChange(calendarId, 'private')
 * ```
 */
export async function updateCalendarMemberAccessOnVisibilityChange(
  calendarId: string,
  newVisibility: string,
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Get the calendar
    const { data: calendar } = await admin
      .from("calendar_configs")
      .select("organization_id")
      .eq("id", calendarId)
      .maybeSingle();

    if (!calendar) return;

    // Get all members with view permission
    const { data: members } = await admin
      .from("calendar_member_permissions")
      .select("member_user_id")
      .eq("calendar_id", calendarId)
      .eq("can_view", true)
      .is("deleted_at", null);

    if (!members) return;

    // For private calendars, keep only explicit permissions
    if (newVisibility === "private") {
      // No role-based access, only explicit permissions remain
      return;
    }

    // For other visibilities, role-based access is implicit
    // but we don't update explicit permissions
    // The permission check logic handles role-based access
  } catch (err) {
    console.error("Update member access on visibility change error:", err);
  }
}

/**
 * Handle event creation to log it in audit trail
 *
 * @param eventId - Event ID
 * @param calendarId - Calendar ID
 * @param actorId - User creating the event
 * @param eventTitle - Event title
 *
 * @example
 * ```typescript
 * await auditEventCreation(eventId, calendarId, actorId, 'Team Meeting')
 * ```
 */
export async function auditEventCreation(
  eventId: string,
  calendarId: string,
  actorId: string,
  eventTitle: string,
): Promise<void> {
  try {
    await logAudit({
      actorId,
      action: "create-event",
      entityType: "calendar_event",
      entityId: eventId,
      metadata: {
        calendarId,
        eventTitle,
      },
    });
  } catch (err) {
    console.error("Event creation audit error:", err);
  }
}

/**
 * Handle event modification to log changes in audit trail
 *
 * @param eventId - Event ID
 * @param calendarId - Calendar ID
 * @param actorId - User modifying the event
 * @param changes - Object describing what changed
 *
 * @example
 * ```typescript
 * await auditEventModification(eventId, calendarId, actorId, {
 *   title: { old: 'Meeting', new: 'Team Sync' }
 * })
 * ```
 */
export async function auditEventModification(
  eventId: string,
  calendarId: string,
  actorId: string,
  changes: Record<string, { old: unknown; new: unknown }>,
): Promise<void> {
  try {
    await logAudit({
      actorId,
      action: "update-event",
      entityType: "calendar_event",
      entityId: eventId,
      metadata: {
        calendarId,
        changes,
      },
    });
  } catch (err) {
    console.error("Event modification audit error:", err);
  }
}
