/**
 * Calendar Audit Logging Utility
 *
 * Centralized audit logging for calendar operations.
 * Logs all calendar and permission-related actions for compliance and debugging.
 *
 * Non-blocking: audit logging failures should not fail the main operation.
 * All functions are designed to work in server actions and route handlers.
 */

import { createAdminClient } from "@/lib/supabase/admin";

import type {
  CalendarAuditLog,
  CalendarAuditAction,
  CalendarAuditEntityType,
  AuditChanges,
} from "@/lib/permissions/calendar-types";

// ============================================================================
// Audit Action Types
// ============================================================================

export const AUDIT_ACTIONS = {
  CALENDAR_CREATED: "calendar_created",
  CALENDAR_UPDATED: "calendar_updated",
  CALENDAR_DELETED: "calendar_deleted",
  EVENT_CREATED: "event_created",
  EVENT_UPDATED: "event_updated",
  EVENT_DELETED: "event_deleted",
  EVENT_VISIBILITY_CHANGED: "event_visibility_changed",
  PERMISSION_GRANTED: "permission_granted",
  PERMISSION_REVOKED: "permission_revoked",
  PERMISSION_UPDATED: "permission_updated",
} as const;

// ============================================================================
// Main Audit Logging Function
// ============================================================================

/**
 * Log a calendar operation to audit trail
 * Non-blocking - failures are logged but don't affect main operation
 *
 * @param organizationId - Organization UUID
 * @param action - Action performed
 * @param entityType - Type of entity affected (calendar, event, permission)
 * @param entityId - ID of affected entity
 * @param actor - User UUID performing action
 * @param changes - Record of what changed {field: {old_value, new_value}}
 * @param metadata - Additional context (reason, source, etc.)
 * @returns void (always succeeds or fails silently)
 */
export async function logCalendarAudit(
  organizationId: string,
  action: CalendarAuditAction,
  entityType: CalendarAuditEntityType,
  entityId: string,
  actor: string,
  changes?: AuditChanges,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Separate calendar_id and event_id based on entity type
    let calendarId: string | null = null;
    let eventId: string | null = null;

    if (entityType === "calendar") {
      calendarId = entityId;
    } else if (entityType === "event") {
      eventId = entityId;
    }

    const logEntry = {
      organization_id: organizationId,
      calendar_id: calendarId,
      event_id: eventId,
      actor_id: actor,
      action,
      entity_type: entityType,
      changes: changes ?? {},
      metadata: metadata ?? {},
    };

    const { error } = await admin.from("calendar_audit_logs").insert(logEntry);

    if (error) {
      console.error("Calendar audit log failed:", {
        error,
        logEntry,
      });
      // Continue - don't let audit failure break the main operation
    }
  } catch (err) {
    console.error("Calendar audit logging error:", err);
    // Fail silently - audit logging is non-blocking
  }
}

// ============================================================================
// Specialized Audit Functions
// ============================================================================

/**
 * Log calendar creation
 *
 * @param organizationId - Organization UUID
 * @param calendarId - Calendar UUID
 * @param actor - User UUID
 * @param calendarData - Calendar properties created
 * @param metadata - Additional context
 */
export async function logCalendarCreated(
  organizationId: string,
  calendarId: string,
  actor: string,
  calendarData?: {
    title?: string;
    visibility?: string;
    description?: string;
  },
  metadata?: Record<string, unknown>,
): Promise<void> {
  const changes: AuditChanges = {
    title: { new_value: calendarData?.title },
    visibility: { new_value: calendarData?.visibility },
    description: { new_value: calendarData?.description },
  };

  await logCalendarAudit(
    organizationId,
    AUDIT_ACTIONS.CALENDAR_CREATED,
    "calendar",
    calendarId,
    actor,
    changes,
    metadata,
  );
}

/**
 * Log calendar update
 *
 * @param organizationId - Organization UUID
 * @param calendarId - Calendar UUID
 * @param actor - User UUID
 * @param oldData - Previous values
 * @param newData - New values
 * @param metadata - Additional context
 */
export async function logCalendarUpdated(
  organizationId: string,
  calendarId: string,
  actor: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const changes: AuditChanges = {};

  // Track only changed fields
  for (const key of Object.keys(newData)) {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        old_value: oldData[key],
        new_value: newData[key],
      };
    }
  }

  await logCalendarAudit(
    organizationId,
    AUDIT_ACTIONS.CALENDAR_UPDATED,
    "calendar",
    calendarId,
    actor,
    changes,
    metadata,
  );
}

/**
 * Log calendar deletion
 *
 * @param organizationId - Organization UUID
 * @param calendarId - Calendar UUID
 * @param actor - User UUID
 * @param softDelete - Whether this is a soft delete
 * @param metadata - Additional context (reason, etc.)
 */
export async function logCalendarDeleted(
  organizationId: string,
  calendarId: string,
  actor: string,
  softDelete: boolean = true,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const changes: AuditChanges = {
    deleted_at: {
      old_value: null,
      new_value: new Date().toISOString(),
    },
  };

  await logCalendarAudit(
    organizationId,
    AUDIT_ACTIONS.CALENDAR_DELETED,
    "calendar",
    calendarId,
    actor,
    changes,
    {
      ...metadata,
      softDelete,
    },
  );
}

/**
 * Log event creation
 *
 * @param organizationId - Organization UUID
 * @param eventId - Event UUID
 * @param calendarId - Parent calendar UUID
 * @param actor - User UUID
 * @param eventData - Event properties
 * @param metadata - Additional context
 */
export async function logEventCreated(
  organizationId: string,
  eventId: string,
  calendarId: string | null,
  actor: string,
  eventData?: {
    title?: string;
    event_type?: string;
    starts_at?: string;
    ends_at?: string;
  },
  metadata?: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();

  const changes: AuditChanges = {
    title: { new_value: eventData?.title },
    event_type: { new_value: eventData?.event_type },
    starts_at: { new_value: eventData?.starts_at },
    ends_at: { new_value: eventData?.ends_at },
  };

  try {
    await admin.from("calendar_audit_logs").insert({
      organization_id: organizationId,
      calendar_id: calendarId,
      event_id: eventId,
      actor_id: actor,
      action: AUDIT_ACTIONS.EVENT_CREATED,
      entity_type: "event",
      changes,
      metadata: metadata ?? {},
    });
  } catch (err) {
    console.error("Failed to log event creation:", err);
  }
}

/**
 * Log event update
 *
 * @param organizationId - Organization UUID
 * @param eventId - Event UUID
 * @param calendarId - Parent calendar UUID
 * @param actor - User UUID
 * @param oldData - Previous values
 * @param newData - New values
 * @param metadata - Additional context
 */
export async function logEventUpdated(
  organizationId: string,
  eventId: string,
  calendarId: string | null,
  actor: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  const changes: AuditChanges = {};

  // Track only changed fields
  for (const key of Object.keys(newData)) {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        old_value: oldData[key],
        new_value: newData[key],
      };
    }
  }

  try {
    await admin.from("calendar_audit_logs").insert({
      organization_id: organizationId,
      calendar_id: calendarId,
      event_id: eventId,
      actor_id: actor,
      action: AUDIT_ACTIONS.EVENT_UPDATED,
      entity_type: "event",
      changes,
      metadata: metadata ?? {},
    });
  } catch (err) {
    console.error("Failed to log event update:", err);
  }
}

/**
 * Log event deletion
 *
 * @param organizationId - Organization UUID
 * @param eventId - Event UUID
 * @param calendarId - Parent calendar UUID
 * @param actor - User UUID
 * @param metadata - Additional context
 */
export async function logEventDeleted(
  organizationId: string,
  eventId: string,
  calendarId: string | null,
  actor: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();

  const changes: AuditChanges = {
    deleted_at: {
      old_value: null,
      new_value: new Date().toISOString(),
    },
  };

  try {
    await admin.from("calendar_audit_logs").insert({
      organization_id: organizationId,
      calendar_id: calendarId,
      event_id: eventId,
      actor_id: actor,
      action: AUDIT_ACTIONS.EVENT_DELETED,
      entity_type: "event",
      changes,
      metadata: metadata ?? {},
    });
  } catch (err) {
    console.error("Failed to log event deletion:", err);
  }
}

/**
 * Log event visibility change
 *
 * @param organizationId - Organization UUID
 * @param eventId - Event UUID
 * @param calendarId - Parent calendar UUID
 * @param actor - User UUID
 * @param oldVisibility - Previous visibility level
 * @param newVisibility - New visibility level
 * @param metadata - Additional context
 */
export async function logEventVisibilityChanged(
  organizationId: string,
  eventId: string,
  calendarId: string | null,
  actor: string,
  oldVisibility: string,
  newVisibility: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();

  const changes: AuditChanges = {
    visibility: {
      old_value: oldVisibility,
      new_value: newVisibility,
    },
  };

  try {
    await admin.from("calendar_audit_logs").insert({
      organization_id: organizationId,
      calendar_id: calendarId,
      event_id: eventId,
      actor_id: actor,
      action: AUDIT_ACTIONS.EVENT_VISIBILITY_CHANGED,
      entity_type: "event",
      changes,
      metadata: metadata ?? {},
    });
  } catch (err) {
    console.error("Failed to log event visibility change:", err);
  }
}

/**
 * Log permission grant
 *
 * @param organizationId - Organization UUID
 * @param calendarId - Calendar UUID
 * @param actor - User UUID granting permission
 * @param memberUserId - User UUID receiving permission
 * @param permissions - Permissions granted
 * @param metadata - Additional context
 */
export async function logPermissionGranted(
  organizationId: string,
  calendarId: string,
  actor: string,
  memberUserId: string,
  permissions: {
    can_view?: boolean;
    can_create_event?: boolean;
    can_edit_event?: boolean;
    can_delete_event?: boolean;
    can_manage_permissions?: boolean;
  },
  metadata?: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();

  const changes: AuditChanges = {
    permissions: {
      new_value: permissions,
    },
  };

  try {
    await admin.from("calendar_audit_logs").insert({
      organization_id: organizationId,
      calendar_id: calendarId,
      event_id: null,
      actor_id: actor,
      action: AUDIT_ACTIONS.PERMISSION_GRANTED,
      entity_type: "permission",
      changes,
      metadata: {
        ...metadata,
        member_user_id: memberUserId,
      },
    });
  } catch (err) {
    console.error("Failed to log permission grant:", err);
  }
}

/**
 * Log permission revocation
 *
 * @param organizationId - Organization UUID
 * @param calendarId - Calendar UUID
 * @param actor - User UUID revoking permission
 * @param memberUserId - User UUID losing permission
 * @param metadata - Additional context
 */
export async function logPermissionRevoked(
  organizationId: string,
  calendarId: string,
  actor: string,
  memberUserId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();

  const changes: AuditChanges = {
    deleted_at: {
      old_value: null,
      new_value: new Date().toISOString(),
    },
  };

  try {
    await admin.from("calendar_audit_logs").insert({
      organization_id: organizationId,
      calendar_id: calendarId,
      event_id: null,
      actor_id: actor,
      action: AUDIT_ACTIONS.PERMISSION_REVOKED,
      entity_type: "permission",
      changes,
      metadata: {
        ...metadata,
        member_user_id: memberUserId,
      },
    });
  } catch (err) {
    console.error("Failed to log permission revocation:", err);
  }
}

/**
 * Log permission update
 *
 * @param organizationId - Organization UUID
 * @param calendarId - Calendar UUID
 * @param actor - User UUID
 * @param memberUserId - User UUID receiving updated permission
 * @param oldPermissions - Previous permissions
 * @param newPermissions - New permissions
 * @param metadata - Additional context
 */
export async function logPermissionUpdated(
  organizationId: string,
  calendarId: string,
  actor: string,
  memberUserId: string,
  oldPermissions: Record<string, boolean>,
  newPermissions: Record<string, boolean>,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  const changes: AuditChanges = {};

  // Track changed permissions
  for (const key of Object.keys(newPermissions)) {
    if (oldPermissions[key] !== newPermissions[key]) {
      changes[key] = {
        old_value: oldPermissions[key],
        new_value: newPermissions[key],
      };
    }
  }

  try {
    await admin.from("calendar_audit_logs").insert({
      organization_id: organizationId,
      calendar_id: calendarId,
      event_id: null,
      actor_id: actor,
      action: AUDIT_ACTIONS.PERMISSION_UPDATED,
      entity_type: "permission",
      changes,
      metadata: {
        ...metadata,
        member_user_id: memberUserId,
      },
    });
  } catch (err) {
    console.error("Failed to log permission update:", err);
  }
}

// ============================================================================
// Audit Log Retrieval Functions
// ============================================================================

/**
 * Get audit logs for an organization
 * Supports filtering by calendar, event, and action
 *
 * @param organizationId - Organization UUID
 * @param filters - Optional filters
 * @param limit - Number of logs to return (default 100)
 * @returns Array of audit logs
 */
export async function getCalendarAuditLogs(
  organizationId: string,
  filters?: {
    calendarId?: string;
    eventId?: string;
    action?: CalendarAuditAction;
    actor?: string;
    entityType?: CalendarAuditEntityType;
    fromDate?: string;
    toDate?: string;
  },
  limit: number = 100,
): Promise<CalendarAuditLog[]> {
  try {
    const admin = createAdminClient();

    let query = admin
      .from("calendar_audit_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filters?.calendarId) {
      query = query.eq("calendar_id", filters.calendarId);
    }

    if (filters?.eventId) {
      query = query.eq("event_id", filters.eventId);
    }

    if (filters?.action) {
      query = query.eq("action", filters.action);
    }

    if (filters?.actor) {
      query = query.eq("actor_id", filters.actor);
    }

    if (filters?.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }

    if (filters?.fromDate) {
      query = query.gte("created_at", filters.fromDate);
    }

    if (filters?.toDate) {
      query = query.lte("created_at", filters.toDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }

    return (data || []) as CalendarAuditLog[];
  } catch (err) {
    console.error("Error getting audit logs:", err);
    return [];
  }
}

/**
 * Get recent changes to a calendar
 *
 * @param organizationId - Organization UUID
 * @param calendarId - Calendar UUID
 * @param limit - Number of logs (default 50)
 * @returns Recent calendar operation logs
 */
export async function getCalendarChanges(
  organizationId: string,
  calendarId: string,
  limit: number = 50,
): Promise<CalendarAuditLog[]> {
  return getCalendarAuditLogs(organizationId, { calendarId }, limit);
}

/**
 * Get recent changes to an event
 *
 * @param organizationId - Organization UUID
 * @param eventId - Event UUID
 * @param limit - Number of logs (default 50)
 * @returns Recent event operation logs
 */
export async function getEventChanges(
  organizationId: string,
  eventId: string,
  limit: number = 50,
): Promise<CalendarAuditLog[]> {
  return getCalendarAuditLogs(organizationId, { eventId }, limit);
}

/**
 * Get permission changes for a calendar
 *
 * @param organizationId - Organization UUID
 * @param calendarId - Calendar UUID
 * @param limit - Number of logs (default 100)
 * @returns Permission-related audit logs
 */
export async function getCalendarPermissionHistory(
  organizationId: string,
  calendarId: string,
  limit: number = 100,
): Promise<CalendarAuditLog[]> {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("calendar_audit_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("calendar_id", calendarId)
      .eq("entity_type", "permission")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch permission history:", error);
      return [];
    }

    return (data || []) as CalendarAuditLog[];
  } catch (err) {
    console.error("Error getting permission history:", err);
    return [];
  }
}

/**
 * Get user's recent actions
 *
 * @param organizationId - Organization UUID
 * @param userId - User UUID
 * @param limit - Number of logs (default 50)
 * @returns User's recent actions
 */
export async function getUserActivityLogs(
  organizationId: string,
  userId: string,
  limit: number = 50,
): Promise<CalendarAuditLog[]> {
  return getCalendarAuditLogs(organizationId, { actor: userId }, limit);
}
