/**
 * Calendar Real-time Subscription Utilities
 *
 * Setup Supabase real-time subscriptions for permission changes,
 * audit logs, and event visibility updates.
 */

import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type RealtimeCallback<T = unknown> = (payload: T) => void;

/**
 * Subscribe to calendar member permission changes
 *
 * Listens for INSERT, UPDATE, DELETE events on calendar_member_permissions
 * for a specific calendar.
 *
 * @param calendarId - Calendar ID
 * @param callback - Function called when permissions change
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = await subscribeToCalendarPermissions(
 *   calendarId,
 *   (change) => {
 *     console.log('Permissions changed:', change.new)
 *     // Refresh UI
 *   }
 * )
 * // Later: unsubscribe()
 * ```
 */
export async function subscribeToCalendarPermissions(
  calendarId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: RealtimeCallback<RealtimePostgresChangesPayload<any>>,
): Promise<(() => void) | null> {
  try {
    const supabase = await createClient();

    const subscription = supabase
      .channel(`calendar-permissions:${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calendar_member_permissions",
          filter: `calendar_id=eq.${calendarId}`,
        },
        (payload) => {
          console.log("[Realtime] Calendar permissions changed:", payload);
          callback(payload);
        },
      )
      .subscribe((status) => {
        console.log(
          `[Realtime] Permission subscription status: ${status}`,
        );
      });

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  } catch (err) {
    console.error("Permission subscription error:", err);
    return null;
  }
}

/**
 * Subscribe to calendar audit logs
 *
 * Listens for INSERT events on calendar_audit_logs for a specific calendar.
 * Useful for tracking permission changes, event creation/modification, etc.
 *
 * @param calendarId - Calendar ID
 * @param callback - Function called when audit logs are added
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = await subscribeToCalendarAuditLogs(
 *   calendarId,
 *   (log) => {
 *     console.log('Audit log:', log.new)
 *   }
 * )
 * ```
 */
export async function subscribeToCalendarAuditLogs(
  calendarId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: RealtimeCallback<RealtimePostgresChangesPayload<any>>,
): Promise<(() => void) | null> {
  try {
    const supabase = await createClient();

    const subscription = supabase
      .channel(`calendar-audit:${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calendar_audit_logs",
          filter: `calendar_id=eq.${calendarId}`,
        },
        (payload) => {
          console.log("[Realtime] Calendar audit log added:", payload);
          callback(payload);
        },
      )
      .subscribe((status) => {
        console.log(`[Realtime] Audit subscription status: ${status}`);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  } catch (err) {
    console.error("Audit log subscription error:", err);
    return null;
  }
}

/**
 * Subscribe to event visibility changes
 *
 * Listens for INSERT, UPDATE, DELETE events on event_visibility
 * for a specific event.
 *
 * @param eventId - Event ID
 * @param callback - Function called when event visibility changes
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = await subscribeToEventVisibility(
 *   eventId,
 *   (change) => {
 *     console.log('Event visibility changed:', change)
 *   }
 * )
 * ```
 */
export async function subscribeToEventVisibility(
  eventId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: RealtimeCallback<RealtimePostgresChangesPayload<any>>,
): Promise<(() => void) | null> {
  try {
    const supabase = await createClient();

    const subscription = supabase
      .channel(`event-visibility:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_visibility",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log("[Realtime] Event visibility changed:", payload);
          callback(payload);
        },
      )
      .subscribe((status) => {
        console.log(`[Realtime] Event visibility subscription status: ${status}`);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  } catch (err) {
    console.error("Event visibility subscription error:", err);
    return null;
  }
}

/**
 * Subscribe to calendar configuration changes
 *
 * Listens for UPDATE events on calendar_configs for a specific calendar.
 * Triggered when visibility, title, or description changes.
 *
 * @param calendarId - Calendar ID
 * @param callback - Function called when calendar config changes
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = await subscribeToCalendarConfig(
 *   calendarId,
 *   (change) => {
 *     console.log('Calendar updated:', change.new)
 *     // Update UI with new title/visibility
 *   }
 * )
 * ```
 */
export async function subscribeToCalendarConfig(
  calendarId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: RealtimeCallback<RealtimePostgresChangesPayload<any>>,
): Promise<(() => void) | null> {
  try {
    const supabase = await createClient();

    const subscription = supabase
      .channel(`calendar-config:${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calendar_configs",
          filter: `id=eq.${calendarId}`,
        },
        (payload) => {
          console.log("[Realtime] Calendar config changed:", payload);
          callback(payload);
        },
      )
      .subscribe((status) => {
        console.log(`[Realtime] Calendar config subscription status: ${status}`);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  } catch (err) {
    console.error("Calendar config subscription error:", err);
    return null;
  }
}

/**
 * Subscribe to multiple calendar events
 *
 * Creates subscriptions for a list of calendars, useful for dashboard views
 * that show multiple calendars.
 *
 * @param calendarIds - Array of calendar IDs
 * @param callback - Function called when any calendar changes
 * @returns Function to unsubscribe from all
 *
 * @example
 * ```typescript
 * const unsubscribeAll = await subscribeToMultipleCalendars(
 *   [calendarId1, calendarId2],
 *   (change, calendarId) => {
 *     console.log(`Calendar ${calendarId} changed:`, change)
 *   }
 * )
 * ```
 */
export async function subscribeToMultipleCalendars(
  calendarIds: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (change: RealtimePostgresChangesPayload<any>, calendarId: string) => void,
): Promise<() => void> {
  const unsubscribeFunctions: Array<() => void> = [];

  for (const calendarId of calendarIds) {
    const unsub = await subscribeToCalendarPermissions(calendarId, (change) => {
      callback(change, calendarId);
    });

    if (unsub) {
      unsubscribeFunctions.push(unsub);
    }
  }

  // Return a function that unsubscribes from all
  return () => {
    for (const unsub of unsubscribeFunctions) {
      unsub();
    }
  };
}

/**
 * Subscribe to all calendar changes for a user's organization
 *
 * Listens to all calendar-related tables in an organization.
 * Use with caution as this creates multiple subscriptions.
 *
 * @param organizationId - Organization ID
 * @param callback - Function called when any calendar changes
 * @returns Function to unsubscribe from all
 *
 * @example
 * ```typescript
 * const unsubscribeAll = await subscribeToOrganizationCalendars(
 *   orgId,
 *   (type, change) => {
 *     console.log(`${type} changed:`, change)
 *   }
 * )
 * ```
 */
export async function subscribeToOrganizationCalendars(
  organizationId: string,
  callback: (
    type: "config" | "permissions" | "audit" | "event-visibility",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    change: RealtimePostgresChangesPayload<any>,
  ) => void,
): Promise<() => void> {
  try {
    const supabase = await createClient();

    const channels = [
      {
        name: `org-calendars:${organizationId}`,
        table: "calendar_configs",
        filter: `organization_id=eq.${organizationId}`,
        type: "config" as const,
      },
      {
        name: `org-permissions:${organizationId}`,
        table: "calendar_member_permissions",
        filter: `organization_id=eq.${organizationId}`,
        type: "permissions" as const,
      },
      {
        name: `org-audit:${organizationId}`,
        table: "calendar_audit_logs",
        filter: `organization_id=eq.${organizationId}`,
        type: "audit" as const,
      },
      {
        name: `org-event-vis:${organizationId}`,
        table: "event_visibility",
        filter: `organization_id=eq.${organizationId}`,
        type: "event-visibility" as const,
      },
    ];

    for (const { name, table, filter, type } of channels) {
      supabase
        .channel(name)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter,
          },
          (payload) => {
            console.log(`[Realtime] ${type} changed in org:`, payload);
            callback(type, payload);
          },
        )
        .subscribe((status) => {
          console.log(`[Realtime] ${type} subscription status: ${status}`);
        });
    }

    // Return unsubscribe function that removes all channels
    return () => {
      for (const { name } of channels) {
        const ch = supabase.getChannels().find((c) => c.topic === name); if (ch) supabase.removeChannel(ch);
      }
    };
  } catch (err) {
    console.error("Organization calendar subscription error:", err);
    return () => {
      // No-op
    };
  }
}
