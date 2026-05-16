"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  EventVisibility,
  CalendarVisibility,
} from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

export interface EventPermissionResult {
  visibility: EventVisibility;
  calendarVisibility: CalendarVisibility;
  isOverridden: boolean;
  allowedMembers: string[];
  isLoading: boolean;
  error: Error | null;
  setEventVisibility: (visibility: EventVisibility) => Promise<void>;
}

export interface EventEditPermissionResult {
  canEdit: boolean;
  canDelete: boolean;
  reason?: string;
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// useEventPermission Hook
// ============================================================================

/**
 * Get who can see a specific event.
 * Handles event-level visibility overrides.
 *
 * @param eventId - Event ID
 * @returns Event visibility details and update function
 */
export function useEventPermission(
  eventId: string | null,
): EventPermissionResult {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["event-permission", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const response = await fetch(`/api/calendar/events/${eventId}/visibility`);
      if (!response.ok) {
        throw new Error("Failed to fetch event visibility");
      }
      return response.json();
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { mutateAsync: setEventVisibility } = useMutation({
    mutationFn: async (visibility: EventVisibility) => {
      if (!eventId) throw new Error("Event ID required");

      const response = await fetch(
        `/api/calendar/events/${eventId}/visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(visibility),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to update event visibility");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["event-permission", eventId],
      });
    },
  });

  return {
    visibility: data?.visibility ?? null,
    calendarVisibility: data?.calendarVisibility ?? "team-only",
    isOverridden: data?.isOverridden ?? false,
    allowedMembers: data?.allowedMembers ?? [],
    isLoading,
    error: error as Error | null,
    setEventVisibility,
  };
}

// ============================================================================
// useEventEditPermission Hook
// ============================================================================

/**
 * Check if user can edit/delete a specific event.
 * Takes into account event ownership and calendar permissions.
 *
 * @param eventId - Event ID to check permissions for
 * @returns Edit/delete capabilities
 */
export function useEventEditPermission(
  eventId: string | null,
): EventEditPermissionResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ["event-edit-permission", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const response = await fetch(
        `/api/calendar/events/${eventId}/edit-permission`,
      );
      if (!response.ok) {
        if (response.status === 403) {
          return {
            canEdit: false,
            canDelete: false,
            reason: "Anda tidak memiliki izin untuk mengedit event ini",
          };
        }
        throw new Error("Failed to fetch edit permission");
      }
      return response.json();
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    canEdit: data?.canEdit ?? false,
    canDelete: data?.canDelete ?? false,
    reason: data?.reason,
    isLoading,
    error: error as Error | null,
  };
}
