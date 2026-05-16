"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { UserRole } from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

export interface PermissionContextResult {
  role: UserRole | null;
  isOwner: boolean;
  isManager: boolean;
  isCaptain: boolean;
  canManageCalendars: boolean;
  canCreateCalendars: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface PermissionChange {
  action: string;
  timestamp: string;
  actor: string;
}

export interface PermissionChangesResult {
  lastChange: PermissionChange | null;
  isSubscribed: boolean;
}

// ============================================================================
// usePermissionContext Hook
// ============================================================================

/**
 * Get user's permission context in an organization.
 * Includes role determination and capability checks.
 *
 * @param teamSlug - Team/organization slug
 * @returns User's role and permissions
 */
export function usePermissionContext(
  teamSlug: string | null,
): PermissionContextResult {
  const { data, isLoading, error, refetch: queryRefetch } = useQuery({
    queryKey: ["permission-context", teamSlug],
    queryFn: async () => {
      if (!teamSlug) return null;

      const response = await fetch(
        `/api/organization/${encodeURIComponent(teamSlug)}/permission-context`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch permission context");
      }
      return response.json();
    },
    enabled: !!teamSlug,
    staleTime: 1000 * 60 * 10, // 10 minutes (role changes infrequent)
  });

  const refetch = async () => {
    await queryRefetch();
  };

  return {
    role: data?.role ?? null,
    isOwner: data?.isOwner ?? false,
    isManager: data?.isManager ?? false,
    isCaptain: data?.isCaptain ?? false,
    canManageCalendars: data?.canManageCalendars ?? false,
    canCreateCalendars: data?.canCreateCalendars ?? false,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================================
// usePermissionChanges Hook
// ============================================================================

/**
 * Listen to permission changes in real-time via Supabase subscriptions.
 * Useful for notifying users when their access level changes.
 *
 * @param calendarId - Calendar ID to monitor
 * @returns Last permission change and subscription status
 */
export function usePermissionChanges(
  calendarId: string | null,
): PermissionChangesResult {
  const [lastChange, setLastChange] = useState<PermissionChange | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!calendarId) {
      setIsSubscribed(false);
      return;
    }

    // Establish WebSocket connection for real-time updates
    const eventSource = new EventSource(
      `/api/calendar/${calendarId}/permission-changes`,
    );

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setLastChange(data);
      } catch (err) {
        console.error("Failed to parse permission change", err);
      }
    };

    const handleOpen = () => {
      setIsSubscribed(true);
    };

    const handleError = () => {
      setIsSubscribed(false);
      eventSource.close();
    };

    eventSource.addEventListener("message", handleMessage);
    eventSource.addEventListener("open", handleOpen);
    eventSource.addEventListener("error", handleError);

    return () => {
      eventSource.removeEventListener("message", handleMessage);
      eventSource.removeEventListener("open", handleOpen);
      eventSource.removeEventListener("error", handleError);
      eventSource.close();
    };
  }, [calendarId]);

  return {
    lastChange,
    isSubscribed,
  };
}
