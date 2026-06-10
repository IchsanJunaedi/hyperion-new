"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Pin, PinOff, Star } from "lucide-react";
import Link from "next/link";

import { useAccessibleCalendars } from "@/features/calendar/hooks/useCalendarPermissions";
import { useCalendarPreferences } from "@/stores/calendar-preferences";
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

const VISIBILITY_LABELS: Record<CalendarVisibility, string> = {
  private: "Pribadi",
  "management-only": "Manajemen",
  "captain-only": "Kapten",
  "team-only": "Tim",
  "selected-members": "Terpilih",
  "public-workspace": "Publik",
};

const VISIBILITY_COLORS: Record<CalendarVisibility, string> = {
  private: "text-ui-text-muted",
  "management-only": "text-purple-400",
  "captain-only": "text-indigo-400",
  "team-only": "text-blue-400",
  "selected-members": "text-emerald-400",
  "public-workspace": "text-yellow-400",
};

function CalendarItem({
  calendar,
  onToggleVisibility,
  onTogglePinned,
  isDefault,
  onSetDefault,
}: CalendarItemProps) {
  const visColor = VISIBILITY_COLORS[calendar.visibility] ?? "text-ui-text-muted";
  const visLabel = VISIBILITY_LABELS[calendar.visibility] ?? calendar.visibility;

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-ui-border bg-ui-surface/40 shadow-xl shadow-black/20 hover:bg-ui-elevated/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-sm font-medium text-ui-text">{calendar.title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-ui-elevated border border-ui-border ${visColor}`}>
            {visLabel}
          </span>
          {isDefault && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              Default
            </span>
          )}
        </div>
        {calendar.description && (
          <p className="text-xs text-ui-text-muted truncate">{calendar.description}</p>
        )}
        <p className="text-xs text-ui-text-muted mt-0.5">{calendar.eventCount} event</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-4 shrink-0">
        <button
          onClick={() => onToggleVisibility(calendar.id)}
          title={calendar.isVisible ? "Sembunyikan kalender" : "Tampilkan kalender"}
          className="p-2 rounded-lg text-ui-text-muted hover:bg-ui-elevated hover:text-ui-text transition-colors"
        >
          {calendar.isVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={() => onTogglePinned(calendar.id)}
          title={calendar.isPinned ? "Lepas pin kalender" : "Pin kalender"}
          className="p-2 rounded-lg transition-colors hover:bg-ui-elevated"
        >
          {calendar.isPinned ? (
            <Pin className="h-4 w-4 text-yellow-400" />
          ) : (
            <PinOff className="h-4 w-4 text-ui-text-muted hover:text-ui-text" />
          )}
        </button>

        <button
          onClick={() => onSetDefault(calendar.id)}
          title="Tetapkan sebagai kalender default"
          className={`p-2 rounded-lg transition-colors ${
            isDefault
              ? "bg-yellow-400/10 text-yellow-400"
              : "text-ui-text-muted hover:bg-ui-elevated hover:text-ui-text"
          }`}
        >
          <Star className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Filter Pills
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
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
            visibilityFilter === filter.value
              ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/30"
              : "bg-ui-elevated text-ui-text-2 border-ui-border hover:bg-ui-hover hover:text-ui-text"
          }`}
        >
          {filter.label}
        </button>
      ))}
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

  const visibleCalendarIds = useCalendarPreferences((state) => state.visibleCalendarIds);
  const pinnedCalendarIds = useCalendarPreferences((state) => state.pinnedCalendarIds);
  const isCalendarVisible = (id: string) => visibleCalendarIds.includes(id);
  const isCalendarPinned = (id: string) => pinnedCalendarIds.includes(id);

  const calendarsWithPreferences: CalendarDisplayItem[] = calendars
    .map((cal) => ({
      ...cal,
      isVisible: isCalendarVisible(cal.id),
      isPinned: isCalendarPinned(cal.id),
    }))
    .filter(
      (cal) => visibilityFilter === "all" || cal.visibility === visibilityFilter,
    )
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (a.id === defaultCalendarId || b.id === defaultCalendarId) {
        return a.id === defaultCalendarId ? -1 : 1;
      }
      return a.visibility.localeCompare(b.visibility);
    });

  const pinnedCount = calendarsWithPreferences.filter((c) => c.isPinned).length;
  const visibleCount = calendarsWithPreferences.filter((c) => c.isVisible).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ui-border border-t-white/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      {/* Tombol Kembali */}
      <div className="flex justify-start">
        <Link
          href={`/${teamSlug}/calendar`}
          className="group inline-flex items-center gap-2 rounded-full border border-ui-border bg-ui-surface/40 px-3.5 py-1.5 text-xs font-semibold text-ui-text-2 transition-all duration-300 hover:bg-ui-elevated/60 hover:text-ui-text"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke kalender
        </Link>
      </div>

      {/* Konten Terpusat */}
      <div className="mx-auto max-w-2xl w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight">
            Pengaturan Tampilan
          </h1>
          <p className="text-sm text-ui-text-2 mt-1">
            Kelola kalender mana yang ingin Anda lihat dan dari mana memulai.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Kalender", value: calendars.length },
            { label: "Terlihat", value: visibleCount },
            { label: "Pinned", value: pinnedCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-ui-border bg-ui-surface/40 p-4 shadow-xl shadow-black/20">
              <p className="text-xs text-ui-text-muted">{stat.label}</p>
              <p className="text-2xl font-bold text-ui-text mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <FilterSection visibilityFilter={visibilityFilter} onFilterChange={setVisibilityFilter} />

        {/* Calendar List */}
        {calendarsWithPreferences.length === 0 ? (
          <div className="text-center py-12 text-ui-text-muted text-sm">
            {visibilityFilter === "all"
              ? "Anda tidak memiliki akses ke kalender apapun"
              : `Tidak ada kalender dengan visibilitas "${visibilityFilter}"`}
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
        <div className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5 shadow-xl shadow-black/20">
          <h4 className="text-sm font-semibold text-ui-text mb-3">Tips</h4>
          <ul className="space-y-1.5 text-xs text-ui-text-muted">
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
