"use client";

import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type EventType = "scrim" | "tournament" | "practice" | "meeting" | "other";
type EventStatus =
  | "draft"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface CalendarToolbarProps {
  year: number;
  month: number; // 0-indexed
  onNavigate: (year: number, month: number) => void;
  onSearch: (query: string) => void;
  onFilterType: (types: string[]) => void;
  onFilterStatus: (statuses: string[]) => void;
  currentFilters?: {
    types?: string[];
    statuses?: string[];
  };
}

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: "scrim", label: "Scrim", color: "bg-blue-400" },
  { value: "tournament", label: "Tournament", color: "bg-yellow-400" },
  { value: "practice", label: "Practice", color: "bg-green-400" },
  { value: "meeting", label: "Meeting", color: "bg-purple-400" },
  { value: "other", label: "Other", color: "bg-white/40" },
];

const EVENT_STATUSES: {
  value: EventStatus;
  label: string;
  color: string;
}[] = [
  { value: "draft", label: "Draft", color: "bg-gray-400" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-400" },
  { value: "ongoing", label: "Ongoing", color: "bg-blue-400" },
  { value: "completed", label: "Completed", color: "bg-gray-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-400" },
];

export function CalendarToolbar({
  year,
  month,
  onNavigate,
  onSearch,
  onFilterType,
  onFilterStatus,
  currentFilters = {},
}: CalendarToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypeFilters, setActiveTypeFilters] = useState<string[]>(
    currentFilters.types ?? [],
  );
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>(
    currentFilters.statuses ?? [],
  );
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const typeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, onSearch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        typeMenuRef.current &&
        !typeMenuRef.current.contains(event.target as Node)
      ) {
        setTypeMenuOpen(false);
      }
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setStatusMenuOpen(false);
      }
    }

    if (typeMenuOpen || statusMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [typeMenuOpen, statusMenuOpen]);

  // Handle type filter toggle
  const handleTypeToggle = useCallback(
    (type: string) => {
      const updated = activeTypeFilters.includes(type)
        ? activeTypeFilters.filter((t) => t !== type)
        : [...activeTypeFilters, type];
      setActiveTypeFilters(updated);
      onFilterType(updated);
    },
    [activeTypeFilters, onFilterType],
  );

  // Handle status filter toggle
  const handleStatusToggle = useCallback(
    (status: string) => {
      const updated = activeStatusFilters.includes(status)
        ? activeStatusFilters.filter((s) => s !== status)
        : [...activeStatusFilters, status];
      setActiveStatusFilters(updated);
      onFilterStatus(updated);
    },
    [activeStatusFilters, onFilterStatus],
  );

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setSearchQuery("");
    setActiveTypeFilters([]);
    setActiveStatusFilters([]);
    onSearch("");
    onFilterType([]);
    onFilterStatus([]);
  }, [onSearch, onFilterType, onFilterStatus]);

  // Navigate to today
  const handleToday = useCallback(() => {
    const today = new Date();
    onNavigate(today.getFullYear(), today.getMonth());
  }, [onNavigate]);

  // Navigate months
  const handleMonthChange = useCallback(
    (delta: number) => {
      const newDate = new Date(year, month + delta, 1);
      onNavigate(newDate.getFullYear(), newDate.getMonth());
    },
    [year, month, onNavigate],
  );

  // Format month label
  const monthLabel = new Date(year, month, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // Check if there are active filters
  const hasActiveFilters =
    searchQuery ||
    activeTypeFilters.length > 0 ||
    activeStatusFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Main toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/2.5 p-4 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 md:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-white/40" />
          </div>
          <input
            type="text"
            placeholder="Cari event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-white placeholder-white/40 transition focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>

        {/* Type Filter Dropdown */}
        <div ref={typeMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setTypeMenuOpen(!typeMenuOpen);
              setStatusMenuOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <Filter className="h-4 w-4" />
            <span>Type</span>
            {activeTypeFilters.length > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/40 text-xs font-bold text-blue-300">
                {activeTypeFilters.length}
              </span>
            )}
          </button>

          {typeMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-white/10 bg-zinc-900 py-2 shadow-xl">
              {EVENT_TYPES.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 px-4 py-2 transition hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={activeTypeFilters.includes(value)}
                    onChange={() => handleTypeToggle(value)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-blue-500"
                  />
                  <span className="flex-1 text-sm text-white">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <div ref={statusMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setStatusMenuOpen(!statusMenuOpen);
              setTypeMenuOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <Filter className="h-4 w-4" />
            <span>Status</span>
            {activeStatusFilters.length > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/40 text-xs font-bold text-green-300">
                {activeStatusFilters.length}
              </span>
            )}
          </button>

          {statusMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-white/10 bg-zinc-900 py-2 shadow-xl">
              {EVENT_STATUSES.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 px-4 py-2 transition hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={activeStatusFilters.includes(value)}
                    onChange={() => handleStatusToggle(value)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-green-500"
                  />
                  <span className="flex-1 text-sm text-white">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Today Button */}
        <button
          type="button"
          onClick={handleToday}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          Hari Ini
        </button>

        {/* Month Navigation & Label */}
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <button
            type="button"
            onClick={() => handleMonthChange(-1)}
            className="rounded p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-40 text-center text-sm font-semibold text-white capitalize">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => handleMonthChange(1)}
            className="rounded p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active Filters Display & Clear */}
      {hasActiveFilters && (
        <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/2.5 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
                <span>Search: "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-blue-300 transition hover:text-blue-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {activeTypeFilters.map((type) => (
              <div
                key={type}
                className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300"
              >
                <span>{type}</span>
                <button
                  type="button"
                  onClick={() => handleTypeToggle(type)}
                  className="text-blue-300 transition hover:text-blue-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {activeStatusFilters.map((status) => (
              <div
                key={status}
                className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300"
              >
                <span>{status}</span>
                <button
                  type="button"
                  onClick={() => handleStatusToggle(status)}
                  className="text-green-300 transition hover:text-green-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="text-right text-xs text-white/60 transition hover:text-white/80 md:text-left"
          >
            Bersihkan semua
          </button>
        </div>
      )}
    </div>
  );
}
