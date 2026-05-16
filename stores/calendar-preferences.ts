import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Type Definitions
// ============================================================================

export interface CalendarPreferences {
  // Visible calendars
  visibleCalendarIds: string[];
  toggleCalendarVisibility: (calendarId: string) => void;
  setVisibleCalendars: (ids: string[]) => void;

  // Default calendar
  defaultCalendarId: string | null;
  setDefaultCalendar: (id: string | null) => void;

  // View settings
  viewMode: "month" | "week" | "day";
  setViewMode: (mode: "month" | "week" | "day") => void;

  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Pinned calendars
  pinnedCalendarIds: string[];
  togglePinnedCalendar: (calendarId: string) => void;
  setPinnedCalendars: (ids: string[]) => void;

  // Persist & hydrate
  hydrate: () => void;
  persist: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  visibleCalendarIds: [],
  defaultCalendarId: null,
  viewMode: "month" as const,
  sidebarCollapsed: false,
  pinnedCalendarIds: [],
};

// ============================================================================
// Zustand Store
// ============================================================================

/**
 * Calendar view preferences store.
 * Persists user's calendar visibility, view mode, and sidebar state.
 * Data is stored in localStorage under 'esports-os:calendar-preferences'.
 */
export const useCalendarPreferences = create<CalendarPreferences>()(
  persist(
    (set) => ({
      ...initialState,

      // Calendar visibility toggles
      toggleCalendarVisibility: (calendarId: string) =>
        set((state) => {
          const index = state.visibleCalendarIds.indexOf(calendarId);
          const newIds = [...state.visibleCalendarIds];

          if (index > -1) {
            newIds.splice(index, 1);
          } else {
            newIds.push(calendarId);
          }

          return { visibleCalendarIds: newIds };
        }),

      setVisibleCalendars: (ids: string[]) =>
        set({ visibleCalendarIds: ids }),

      // Default calendar
      setDefaultCalendar: (id: string | null) =>
        set({ defaultCalendarId: id }),

      // View mode
      setViewMode: (mode: "month" | "week" | "day") =>
        set({ viewMode: mode }),

      // Sidebar toggle
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Pinned calendars
      togglePinnedCalendar: (calendarId: string) =>
        set((state) => {
          const index = state.pinnedCalendarIds.indexOf(calendarId);
          const newIds = [...state.pinnedCalendarIds];

          if (index > -1) {
            newIds.splice(index, 1);
          } else {
            newIds.push(calendarId);
          }

          return { pinnedCalendarIds: newIds };
        }),

      setPinnedCalendars: (ids: string[]) =>
        set({ pinnedCalendarIds: ids }),

      // Hydrate from localStorage
      hydrate: () => {
        // Triggered automatically by Zustand persist middleware
      },

      // Persist to localStorage
      persist: () => {
        // Triggered automatically by Zustand persist middleware
      },
    }),
    {
      name: "esports-os:calendar-preferences",
      version: 1,
    },
  ),
);

// ============================================================================
// Selectors (for granular subscriptions)
// ============================================================================

export const selectVisibleCalendarIds = (state: CalendarPreferences) =>
  state.visibleCalendarIds;

export const selectDefaultCalendarId = (state: CalendarPreferences) =>
  state.defaultCalendarId;

export const selectViewMode = (state: CalendarPreferences) => state.viewMode;

export const selectSidebarCollapsed = (state: CalendarPreferences) =>
  state.sidebarCollapsed;

export const selectPinnedCalendarIds = (state: CalendarPreferences) =>
  state.pinnedCalendarIds;

/**
 * Check if a specific calendar is visible
 */
export const selectIsCalendarVisible = (calendarId: string) => (
  state: CalendarPreferences,
) => state.visibleCalendarIds.includes(calendarId);

/**
 * Check if a specific calendar is pinned
 */
export const selectIsCalendarPinned = (calendarId: string) => (
  state: CalendarPreferences,
) => state.pinnedCalendarIds.includes(calendarId);
