"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

interface CalendarToolbarProps {
  year: number;
  month: number;
  onNavigate: (year: number, month: number) => void;
  onSearch: (query: string) => void;
  onFilterType: (types: string[]) => void;
  onFilterStatus: (statuses: string[]) => void;
  currentFilters?: { types?: string[]; statuses?: string[] };
}

const EVENT_TYPES = [
  { value: "scrim", label: "Scrim" },
  { value: "tournament", label: "Turnamen" },
  { value: "practice", label: "Latihan" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Lainnya" },
];

const EVENT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "ongoing", label: "Sedang Berlangsung" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const CalendarToolbar = ({
  year,
  month,
  onNavigate,
  onSearch,
  onFilterType,
  onFilterStatus,
  currentFilters = {},
}: CalendarToolbarProps) => {
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

  const debouncedSearch = useDebouncedCallback((query: string) => {
    onSearch(query);
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  const handleTypeFilterToggle = useCallback(
    (type: string) => {
      const newFilters = activeTypeFilters.includes(type)
        ? activeTypeFilters.filter((t) => t !== type)
        : [...activeTypeFilters, type];
      setActiveTypeFilters(newFilters);
      onFilterType(newFilters);
    },
    [activeTypeFilters, onFilterType],
  );

  const handleStatusFilterToggle = useCallback(
    (status: string) => {
      const newFilters = activeStatusFilters.includes(status)
        ? activeStatusFilters.filter((s) => s !== status)
        : [...activeStatusFilters, status];
      setActiveStatusFilters(newFilters);
      onFilterStatus(newFilters);
    },
    [activeStatusFilters, onFilterStatus],
  );

  const handleTodayClick = useCallback(() => {
    const today = new Date();
    onNavigate(today.getFullYear(), today.getMonth());
  }, [onNavigate]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setActiveTypeFilters([]);
    setActiveStatusFilters([]);
    onSearch("");
    onFilterType([]);
    onFilterStatus([]);
  }, [onSearch, onFilterType, onFilterStatus]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const hasActiveFilters =
    searchQuery !== "" ||
    activeTypeFilters.length > 0 ||
    activeStatusFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Search and filter row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
        {/* Search input */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ui-text-muted" />
          <input
            type="text"
            placeholder="Cari event..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-10 w-full rounded-md border border-ui-border bg-ui-surface pl-9 pr-3 text-sm text-ui-text placeholder:text-ui-text-muted focus:border-yellow-400 focus:outline-none"
          />
        </div>

        {/* Type Filter Dropdown */}
        <div className="relative" ref={typeMenuRef}>
          <button
            type="button"
            onClick={() => setTypeMenuOpen(!typeMenuOpen)}
            className="inline-flex items-center gap-2 rounded-md border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text transition hover:bg-ui-elevated hover:text-ui-text"
          >
            <span>Tipe</span>
            {activeTypeFilters.length > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/30 text-xs font-semibold text-blue-300">
                {activeTypeFilters.length}
              </span>
            )}
          </button>
          {typeMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 space-y-1 rounded-lg border border-ui-border bg-ui-elevated p-2 shadow-lg">
              {EVENT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-ui-text transition hover:bg-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={activeTypeFilters.includes(type.value)}
                    onChange={() => handleTypeFilterToggle(type.value)}
                    className="h-4 w-4 rounded border-white/20 bg-ui-surface text-blue-400 focus:ring-blue-400"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative" ref={statusMenuRef}>
          <button
            type="button"
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className="inline-flex items-center gap-2 rounded-md border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text transition hover:bg-ui-elevated hover:text-ui-text"
          >
            <span>Status</span>
            {activeStatusFilters.length > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/30 text-xs font-semibold text-green-300">
                {activeStatusFilters.length}
              </span>
            )}
          </button>
          {statusMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 space-y-1 rounded-lg border border-ui-border bg-ui-elevated p-2 shadow-lg">
              {EVENT_STATUSES.map((status) => (
                <label
                  key={status.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-ui-text transition hover:bg-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={activeStatusFilters.includes(status.value)}
                    onChange={() => handleStatusFilterToggle(status.value)}
                    className="h-4 w-4 rounded border-white/20 bg-ui-surface text-green-400 focus:ring-green-400"
                  />
                  {status.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Today button */}
        <button
          type="button"
          onClick={handleTodayClick}
          className="rounded-md border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text transition hover:bg-ui-elevated hover:text-ui-text"
        >
          Hari Ini
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            const newDate = new Date(year, month - 1, 1);
            onNavigate(newDate.getFullYear(), newDate.getMonth());
          }}
          className="rounded-md p-2 text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center text-sm font-semibold capitalize text-ui-text">
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={() => {
            const newDate = new Date(year, month + 1, 1);
            onNavigate(newDate.getFullYear(), newDate.getMonth());
          }}
          className="rounded-md p-2 text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchQuery && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
              <span>&quot;{searchQuery}&quot;</span>
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="cursor-pointer hover:text-blue-200"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {activeTypeFilters.map((type) => {
            const label = EVENT_TYPES.find((t) => t.value === type)?.label;
            return (
              <div
                key={type}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300"
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => handleTypeFilterToggle(type)}
                  className="cursor-pointer hover:text-blue-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          {activeStatusFilters.map((status) => {
            const label = EVENT_STATUSES.find((s) => s.value === status)?.label;
            return (
              <div
                key={status}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300"
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => handleStatusFilterToggle(status)}
                  className="cursor-pointer hover:text-green-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-ui-text-2 transition hover:text-ui-text"
            >
              Bersihkan semua
            </button>
          )}
        </div>
      )}
    </div>
  );
};
export { CalendarToolbar };
