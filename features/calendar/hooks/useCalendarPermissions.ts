"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  CalendarConfig,
  CalendarMemberPermission,
  CalendarAuditLog,
  CalendarVisibility,
  UserRole,
} from "@/lib/permissions/calendar-types";
import type { Database } from "@/types/database";

// ============================================================================
// Type Definitions
// ============================================================================

export interface AccessibleCalendarResult extends CalendarConfig {
  eventCount: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
}

export interface CalendarMemberPermissionWithProfile extends CalendarMemberPermission {
  member: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface PermissionCheckResult {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface AuditLogFilter {
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// useCalendarPermission Hook
// ============================================================================

/**
 * Check if user can perform specific actions on a calendar.
 * Returns detailed permission breakdown.
 *
 * @param calendarId - Calendar ID to check permissions for
 * @returns Permission check result with action capabilities
 */
export function useCalendarPermission(
  calendarId: string | null,
): PermissionCheckResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-permission", calendarId],
    queryFn: async () => {
      if (!calendarId) return null;

      const response = await fetch(`/api/calendar/permissions/${calendarId}`);
      if (!response.ok) {
        if (response.status === 403) {
          return {
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canManage: false,
          };
        }
        throw new Error("Failed to fetch permissions");
      }
      return response.json();
    },
    enabled: !!calendarId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    canView: data?.canView ?? false,
    canCreate: data?.canCreate ?? false,
    canEdit: data?.canEdit ?? false,
    canDelete: data?.canDelete ?? false,
    canManage: data?.canManage ?? false,
    isLoading,
    error: error as Error | null,
  };
}

// ============================================================================
// useAccessibleCalendars Hook
// ============================================================================

/**
 * Get all calendars accessible by the current user.
 * Filters based on user's role and calendar visibility.
 *
 * @param teamSlug - Team slug for context
 * @returns Accessible calendars with permissions
 */
export function useAccessibleCalendars(teamSlug: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["accessible-calendars", teamSlug],
    queryFn: async () => {
      if (!teamSlug) return [];

      const response = await fetch(
        `/api/calendar/accessible?teamSlug=${encodeURIComponent(teamSlug)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch accessible calendars");
      }
      const result = await response.json();
      return result.calendars as AccessibleCalendarResult[];
    },
    enabled: !!teamSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    calendars: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================================
// useCalendarVisibility Hook
// ============================================================================

/**
 * Get and manage calendar visibility settings.
 *
 * @param calendarId - Calendar ID
 * @param teamSlug - Team slug for API context
 * @returns Current visibility and update function
 */
export function useCalendarVisibility(
  calendarId: string | null,
  teamSlug: string | null,
) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-visibility", calendarId],
    queryFn: async () => {
      if (!calendarId) return null;

      const response = await fetch(`/api/calendar/${calendarId}/visibility`);
      if (!response.ok) {
        throw new Error("Failed to fetch visibility");
      }
      return response.json();
    },
    enabled: !!calendarId,
    staleTime: 1000 * 60 * 5,
  });

  const { mutateAsync: setVisibility } = useMutation({
    mutationFn: async (payload: {
      visibility: CalendarVisibility;
      selectedMembers?: string[];
    }) => {
      if (!calendarId || !teamSlug) {
        throw new Error("Missing required parameters");
      }

      const response = await fetch(`/api/calendar/${calendarId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update visibility");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-visibility", calendarId],
      });
      queryClient.invalidateQueries({
        queryKey: ["accessible-calendars", teamSlug],
      });
    },
  });

  return {
    visibility: (data?.visibility as CalendarVisibility) ?? "team-only",
    selectedMembers: data?.selectedMembers ?? [],
    isLoading,
    error: error as Error | null,
    setVisibility,
  };
}

// ============================================================================
// useMemberPermissions Hook
// ============================================================================

/**
 * Get and manage member permissions for a calendar.
 * Requires manage-permissions capability.
 *
 * @param calendarId - Calendar ID
 * @param teamSlug - Team slug for API context
 * @returns List of members with permissions and management functions
 */
export function useMemberPermissions(
  calendarId: string | null,
  teamSlug: string | null,
) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["calendar-member-permissions", calendarId],
    queryFn: async () => {
      if (!calendarId) return [];

      const response = await fetch(`/api/calendar/${calendarId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch member permissions");
      }
      const result = await response.json();
      return result.members as CalendarMemberPermissionWithProfile[];
    },
    enabled: !!calendarId,
    staleTime: 1000 * 60 * 5,
  });

  const { mutateAsync: grantPermission } = useMutation({
    mutationFn: async (payload: {
      memberId: string;
      permissions: Partial<CalendarMemberPermission>;
    }) => {
      if (!calendarId) throw new Error("Calendar ID required");

      const response = await fetch(
        `/api/calendar/${calendarId}/members/${payload.memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload.permissions),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to grant permission");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-member-permissions", calendarId],
      });
    },
  });

  const { mutateAsync: revokePermission } = useMutation({
    mutationFn: async (memberId: string) => {
      if (!calendarId) throw new Error("Calendar ID required");

      const response = await fetch(
        `/api/calendar/${calendarId}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to revoke permission");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-member-permissions", calendarId],
      });
    },
  });

  return {
    members: data ?? [],
    isLoading,
    error: error as Error | null,
    grantPermission,
    revokePermission,
    refetch,
  };
}

// ============================================================================
// useCalendarAuditLogs Hook
// ============================================================================

/**
 * Fetch and filter calendar audit logs.
 * Requires manage-calendar capability.
 *
 * @param calendarId - Optional calendar ID to filter logs (all if not provided)
 * @returns Audit logs with filtering capability
 */
export function useCalendarAuditLogs(calendarId?: string | null) {
  const [filter, setFilter] = useState<AuditLogFilter>({
    limit: 50,
    offset: 0,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["calendar-audit-logs", calendarId, filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (calendarId) params.append("calendarId", calendarId);
      if (filter.action) params.append("action", filter.action);
      if (filter.startDate)
        params.append("startDate", filter.startDate.toISOString());
      if (filter.endDate)
        params.append("endDate", filter.endDate.toISOString());
      params.append("limit", String(filter.limit ?? 50));
      params.append("offset", String(filter.offset ?? 0));

      const response = await fetch(
        `/api/calendar/audit-logs?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }
      const result = await response.json();
      return result.logs as CalendarAuditLog[];
    },
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    logs: data ?? [],
    isLoading,
    error: error as Error | null,
    setFilter,
    refetch,
  };
}

// ============================================================================
// useCalendarManagement Hook
// ============================================================================

/**
 * Comprehensive hook combining calendar config, permissions, and audit logs.
 * Useful for management pages that need all related data.
 *
 * @param calendarId - Calendar ID
 * @param teamSlug - Team slug for API context
 * @returns Combined data with refetch capability
 */
export function useCalendarManagement(
  calendarId: string | null,
  teamSlug: string | null,
) {
  const {
    data: calendar,
    isLoading: calendarLoading,
    error: calendarError,
  } = useQuery({
    queryKey: ["calendar-config", calendarId],
    queryFn: async () => {
      if (!calendarId) return null;

      const response = await fetch(`/api/calendar/${calendarId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch calendar");
      }
      return response.json() as Promise<CalendarConfig>;
    },
    enabled: !!calendarId,
    staleTime: 1000 * 60 * 5,
  });

  const permissions = useMemberPermissions(calendarId, teamSlug);
  const auditLogs = useCalendarAuditLogs(calendarId);

  const refetch = useCallback(async () => {
    await Promise.all([permissions.refetch(), auditLogs.refetch()]);
  }, [permissions, auditLogs]);

  return {
    calendar: calendar ?? null,
    permissions: permissions.members,
    auditLogs: auditLogs.logs,
    isLoading: calendarLoading || permissions.isLoading || auditLogs.isLoading,
    error: calendarError || permissions.error || auditLogs.error,
    refetch,
  };
}
