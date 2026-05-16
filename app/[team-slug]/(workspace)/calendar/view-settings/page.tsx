"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Eye, EyeOff, Pin, PinOff, Star } from "lucide-react";
import Link from "next/link";

import { useAccessibleCalendars } from "@/features/calendar/hooks/useCalendarPermissions";
import { useCalendarPreferences, selectIsCalendarVisible, selectIsCalendarPinned } from "@/stores/calendar-preferences";
import type { AccessibleCalendarResult } from "@/features/calendar/hooks/useCalendarPermissions";
import type { CalendarVisibility } from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

interface CalendarDisplayItem extends AccessibleCalendarResult {
  isVisible: boolean;
  isPinned: boolean;
}

// ============================================================================
// Calendar List Item Component
// ============================================================================

interface CalendarItemProps {
  calendar: CalendarDisplayItem;
  onToggleVisibility: (id: string) => void;
  onTogglePinned: (id: string) => void;
  isDefault: boolean;
  onSetDefault: (id: string) => void;
}

function CalendarItem({
  calendar,
  onToggleVisibility,
  onTogglePinned,
  isDefault,
  onSetDefault,
}: CalendarItemProps) {
  const getVisibilityColor = (visibility: CalendarVisibility) => {
    switch (visibility) {
      case "private":
        return "text-gray-500";
      case "management-only":
        return "text-purple-500";
      case "captain-only":
        return "text-indigo-500";
      case "team-only":
        return "text-blue-500";
      case "selected-members":
        return "text-green-500";
      case "public-workspace":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  const getVisibilityLabel = (visibility: CalendarVisibility) => {
    switch (visibility) {
      case "private":
        return "Pribadi";
      case "management-only":
        return "Manajemen";
      case "captain-only":
        return "Kapten";
      case "team-only":
        return "Tim";
      case "selected-members":
        return "Terpilih";
      case "public-workspace":
        return "Publik";
      default:
        return visibility;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {calendar.title}
          </h3>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 ${getVisibilityColor(
              calendar.visibility,
            )}`}
          >
            {getVisibilityLabel(calendar.visibility)}
          </span>
          {isDefault && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200">
              Default
            </span>
          )}
        </div>
        {calendar.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {calendar.description}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {calendar.eventCount} event
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Visibility Toggle */}
        <button
          onClick={() => onToggleVisibility(calendar.id)}
          title={calendar.isVisible ? "Sembunyikan kalender" : "Tampilkan kalender"}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {calendar.isVisible ? (
            <Eye className="h-5 w-5" />
          ) : (
            <EyeOff className="h-5 w-5" />
          )}
        </button>

        {/* Pin Toggle */}
        <button
          onClick={() => onTogglePinned(calendar.id)}
          title={calendar.isPinned ? "Lepas pin kalender" : "Pin kalender"}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {calendar.isPinned ? (
            <Pin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <PinOff className="h-5 w-5" />
          )}
        </button>

        {/* Set as Default */}
        <button
          onClick={() => onSetDefault(calendar.id)}
          title="Tetapkan sebagai kalender default"
          className={`p-2 rounded-lg transition-colors ${
            isDefault
              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Star className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Filter Section
// ============================================================================

interface FilterSectionProps {
  visibilityFilter: CalendarVisibility | "all";
  onFilterChange: (visibility: CalendarVisibility | "all") => void;
}

function FilterSection({ visibilityFilter, onFilterChange }: FilterSectionProps) {
  const filters: Array<{ value: CalendarVisibility | "all"; label: string }> = [
    { value: "all", label: "Semua" },
    { value: "private", label: "Pribadi" },
    { value: "management-only", label: "Manajemen" },
    { value: "captain-only", label: "Kapten" },
    { value: "team-only", label: "Tim" },
    { value: "selected-members", label: "Terpilih" },
    { value: "public-workspace", label: "Publik" },
  ];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Filter Visibilitas
      </h3>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              visibilityFilter === filter.value
                ? "bg-blue-600 dark:bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function CalendarViewSettingsPage() {
  const params = useParams();
  const teamSlug = params["team-slug"] as string;
  const [visibilityFilter, setVisibilityFilter] = useState<CalendarVisibility | "all">("all");

  const { calendars, isLoading } = useAccessibleCalendars(teamSlug);
  const {
    toggleCalendarVisibility,
    togglePinnedCalendar,
    defaultCalendarId,
    setDefaultCalendar,
  } = useCalendarPreferences();

  // Get selector hooks
  const isCalendarVisible = useCalendarPreferences(selectIsCalendarVisible);
  const isCalendarPinned = useCalendarPreferences(selectIsCalendarPinned);

  // Combine data
  const calendarsWithPreferences: CalendarDisplayItem[] = calendars
    .map((cal) => ({
      ...cal,
      isVisible: isCalendarVisible(cal.id),
      isPinned: isCalendarPinned(cal.id),
    }))
    .filter(
      (cal) =>
        visibilityFilter === "all" || cal.visibility === visibilityFilter,
    )
    .sort((a, b) => {
      // Pinned calendars first
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // Default calendar second
      if (a.id === defaultCalendarId || b.id === defaultCalendarId) {
        return a.id === defaultCalendarId ? -1 : 1;
      }
      // Then by visibility priority
      return a.visibility.localeCompare(b.visibility);
    });

  const pinnedCount = calendarsWithPreferences.filter((c) => c.isPinned).length;
  const visibleCount = calendarsWithPreferences.filter((c) => c.isVisible).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Link
              href={`/${teamSlug}`}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Workspace
            </Link>
            <span>/</span>
            <Link
              href={`/${teamSlug}/calendar`}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Kalender
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100">Pengaturan Tampilan</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Pengaturan Tampilan Kalender
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Kelola kalender mana yang ingin Anda lihat dan dari mana memulai.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Kalender</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {calendars.length}
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Terlihat</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {visibleCount}
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pinned</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {pinnedCount}
            </p>
          </div>
        </div>

        {/* Filter */}
        <FilterSection
          visibilityFilter={visibilityFilter}
          onFilterChange={setVisibilityFilter}
        />

        {/* Calendar List */}
        {calendarsWithPreferences.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {visibilityFilter === "all"
                ? "Anda tidak memiliki akses ke kalender apapun"
                : `Tidak ada kalender dengan visibilitas "${visibilityFilter}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {calendarsWithPreferences.map((calendar) => (
              <CalendarItem
                key={calendar.id}
                calendar={calendar}
                onToggleVisibility={toggleCalendarVisibility}
                onTogglePinned={togglePinnedCalendar}
                isDefault={defaultCalendarId === calendar.id}
                onSetDefault={setDefaultCalendar}
              />
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
            Tips
          </h4>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <li>• Sembunyikan kalender yang tidak ingin Anda lihat di tampilan utama</li>
            <li>• Pin kalender favorit Anda untuk akses cepat</li>
            <li>• Tetapkan kalender default untuk membuat event baru</li>
            <li>• Preferensi Anda akan tersimpan secara otomatis</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
