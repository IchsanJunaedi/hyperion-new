"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Download,
  ChevronDown,
  Search,
  Filter,
  Calendar,
  ArrowRight,
} from "lucide-react";

import type { CalendarAuditLog } from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

interface AuditLogViewerProps {
  logs: CalendarAuditLog[];
  onExport?: () => Promise<void>;
  onFilterChange?: (filters: AuditFilterOptions) => void;
  isLoading?: boolean;
  compact?: boolean;
}

interface AuditFilterOptions {
  actionType?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  search?: string;
}

interface AuditLogEntryProps {
  log: CalendarAuditLog;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

// ============================================================================
// Action Icons & Colors
// ============================================================================

const ACTION_CONFIG: Record<
  string,
  { color: string; label: string; icon: string }
> = {
  calendar_created: {
    color: "green",
    label: "Calendar Created",
    icon: "📅",
  },
  calendar_updated: {
    color: "blue",
    label: "Calendar Updated",
    icon: "✏️",
  },
  calendar_deleted: { color: "red", label: "Calendar Deleted", icon: "🗑️" },
  event_created: {
    color: "green",
    label: "Event Created",
    icon: "📌",
  },
  event_updated: {
    color: "blue",
    label: "Event Updated",
    icon: "✏️",
  },
  event_deleted: { color: "red", label: "Event Deleted", icon: "🗑️" },
  event_visibility_changed: {
    color: "purple",
    label: "Visibility Changed",
    icon: "👁️",
  },
  permission_granted: {
    color: "green",
    label: "Permission Granted",
    icon: "✅",
  },
  permission_revoked: {
    color: "red",
    label: "Permission Revoked",
    icon: "❌",
  },
  permission_updated: {
    color: "blue",
    label: "Permission Updated",
    icon: "🔐",
  },
};

const COLOR_MAP: Record<string, string> = {
  green: "bg-green-500/20 border-green-500/30 text-green-400",
  blue: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  red: "bg-red-500/20 border-red-500/30 text-red-400",
  purple: "bg-purple-500/20 border-purple-500/30 text-purple-400",
};

// ============================================================================
// Change Display Component
// ============================================================================

interface ChangeDisplayProps {
  changes: Record<string, { old_value?: unknown; new_value?: unknown }>;
}

function ChangeDisplay({ changes }: ChangeDisplayProps) {
  const changeEntries = Object.entries(changes);

  if (changeEntries.length === 0) {
    return (
      <p className="text-xs text-ui-text-muted">No changes recorded</p>
    );
  }

  return (
    <div className="space-y-2">
      {changeEntries.map(([key, change]) => (
        <div
          key={key}
          className="flex items-start gap-2 text-xs p-2 rounded bg-ui-surface border border-ui-border"
        >
          <span className="font-medium text-ui-text-2 min-w-[100px]">
            {key}:
          </span>
          <div className="flex-1 flex items-center gap-2">
            {change.old_value !== undefined && (
              <code className="px-2 py-1 rounded bg-ui-hover text-red-400 text-[11px] font-mono max-w-[200px] overflow-hidden text-ellipsis">
                {typeof change.old_value === "object"
                  ? JSON.stringify(change.old_value).slice(0, 50)
                  : String(change.old_value)}
              </code>
            )}
            {change.old_value !== undefined && change.new_value !== undefined && (
              <ArrowRight className="h-3 w-3 text-ui-text-muted flex-shrink-0" />
            )}
            {change.new_value !== undefined && (
              <code className="px-2 py-1 rounded bg-ui-hover text-green-400 text-[11px] font-mono max-w-[200px] overflow-hidden text-ellipsis">
                {typeof change.new_value === "object"
                  ? JSON.stringify(change.new_value).slice(0, 50)
                  : String(change.new_value)}
              </code>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Log Entry Component
// ============================================================================

function AuditLogEntry({
  log,
  expanded = false,
  onToggleExpand,
}: AuditLogEntryProps) {
  const config = ACTION_CONFIG[log.action] || {
    color: "blue",
    label: log.action,
    icon: "📝",
  };
  const colorClass = COLOR_MAP[config.color];
  const timestamp = new Date(log.created_at);
  const timeStr = timestamp.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = timestamp.toLocaleDateString("id-ID");

  return (
    <div className="rounded-lg border border-ui-border bg-ui-hover overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-ui-surface transition text-left"
      >
        {/* Action Badge */}
        <div
          className={`flex-shrink-0 px-2 py-1 rounded border text-xs font-medium ${colorClass}`}
        >
          {config.label}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-ui-text">
              {config.icon} {config.label}
            </span>
            {log.entity_type && (
              <span className="text-xs px-2 py-0.5 rounded bg-ui-surface text-ui-text-2">
                {log.entity_type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-ui-text-muted">
            <Calendar className="h-3 w-3" />
            <span>
              {dateStr} at {timeStr}
            </span>
          </div>
        </div>

        {/* Expand Icon */}
        <ChevronDown
          className={`h-5 w-5 text-ui-text-muted flex-shrink-0 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Details */}
      {expanded && (
        <div className="px-4 py-3 border-t border-ui-border bg-ui-surface space-y-3">
          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {log.actor_id && (
              <div>
                <p className="text-ui-text-muted font-medium">Actor ID</p>
                <p className="text-ui-text-2 font-mono break-all">
                  {log.actor_id.slice(0, 8)}...
                </p>
              </div>
            )}
            {log.calendar_id && (
              <div>
                <p className="text-ui-text-muted font-medium">Calendar ID</p>
                <p className="text-ui-text-2 font-mono break-all">
                  {log.calendar_id.slice(0, 8)}...
                </p>
              </div>
            )}
            {log.event_id && (
              <div>
                <p className="text-ui-text-muted font-medium">Event ID</p>
                <p className="text-ui-text-2 font-mono break-all">
                  {log.event_id.slice(0, 8)}...
                </p>
              </div>
            )}
          </div>

          {/* Changes */}
          {Object.keys(log.changes).length > 0 && (
            <div>
              <p className="text-xs font-medium text-ui-text-muted uppercase tracking-wider mb-2">
                Changes
              </p>
              <ChangeDisplay changes={log.changes} />
            </div>
          )}

          {/* Metadata */}
          {Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-xs font-medium text-ui-text-muted uppercase tracking-wider mb-2">
                Metadata
              </p>
              <pre className="text-xs bg-ui-hover rounded p-2 overflow-x-auto text-ui-text-2 max-h-48">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filter Controls Component
// ============================================================================

interface FilterControlsProps {
  filters: AuditFilterOptions;
  onFilterChange: (filters: AuditFilterOptions) => void;
  actionTypes: string[];
}

function FilterControls({
  filters,
  onFilterChange,
  actionTypes,
}: FilterControlsProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ui-text-muted" />
        <input
          type="text"
          placeholder="Search logs..."
          value={filters.search || ""}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          className="w-full pl-10 pr-10 py-2 rounded-lg bg-ui-hover border border-ui-border focus:border-[#404040] text-ui-text placeholder-ui-text-muted outline-none transition"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-ui-surface rounded transition"
        >
          <Filter className="h-4 w-4 text-ui-text-muted" />
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-ui-surface border border-ui-border">
          {/* Action Type */}
          <div>
            <label className="block text-xs font-medium text-ui-text-muted uppercase tracking-wider mb-2">
              Action Type
            </label>
            <select
              value={filters.actionType || ""}
              onChange={(e) =>
                onFilterChange({ ...filters, actionType: e.target.value || undefined })
              }
              className="w-full px-3 py-2 rounded-lg bg-ui-hover border border-ui-border text-ui-text text-sm"
            >
              <option value="">All Actions</option>
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {ACTION_CONFIG[type]?.label || type}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-ui-text-muted uppercase tracking-wider mb-2">
              From
            </label>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) =>
                onFilterChange({ ...filters, startDate: e.target.value || undefined })
              }
              className="w-full px-3 py-2 rounded-lg bg-ui-hover border border-ui-border text-ui-text text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-ui-text-muted uppercase tracking-wider mb-2">
              To
            </label>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) =>
                onFilterChange({ ...filters, endDate: e.target.value || undefined })
              }
              className="w-full px-3 py-2 rounded-lg bg-ui-hover border border-ui-border text-ui-text text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Audit log viewer with timeline, filtering, and export functionality.
 * Displays all permission changes and calendar operations.
 */
const AuditLogViewer = ({
  logs,
  onExport,
  onFilterChange,
  isLoading = false,
  compact = false,
}: AuditLogViewerProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilterOptions>({});
  const [exporting, setExporting] = useState(false);

  const actionTypes = useMemo(
    () => [...new Set(logs.map((l) => l.action))],
    [logs],
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filters.actionType && log.action !== filters.actionType) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !log.action.toLowerCase().includes(searchLower) &&
          !log.entity_type.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      if (filters.startDate) {
        const logDate = new Date(log.created_at);
        const startDate = new Date(filters.startDate);
        if (logDate < startDate) return false;
      }
      if (filters.endDate) {
        const logDate = new Date(log.created_at);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (logDate > endDate) return false;
      }
      return true;
    });
  }, [logs, filters]);

  const handleFilterChange = useCallback(
    (newFilters: AuditFilterOptions) => {
      setFilters(newFilters);
      onFilterChange?.(newFilters);
    },
    [onFilterChange],
  );

  const handleExport = async () => {
    if (!onExport) return;
    setExporting(true);
    try {
      await onExport();
    } finally {
      setExporting(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {logs.slice(0, 5).map((log) => {
          const config = ACTION_CONFIG[log.action] || {
            color: "blue",
            label: log.action,
          };
          const colorClass = COLOR_MAP[config.color];
          const timestamp = new Date(log.created_at);

          return (
            <div
              key={log.id}
              className="flex items-center justify-between p-2 rounded-lg bg-ui-hover border border-ui-border"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ui-text truncate">
                  {config.label}
                </p>
                <p className="text-[10px] text-ui-text-muted">
                  {timestamp.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
                {log.entity_type}
              </div>
            </div>
          );
        })}
        {logs.length > 5 && (
          <p className="text-xs text-ui-text-muted px-2">
            +{logs.length - 5} more entries
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ui-text">
            Audit Log
          </h3>
          <p className="text-sm text-ui-text-muted mt-1">
            {filteredLogs.length} of {logs.length} entries
          </p>
        </div>
        {onExport && (
          <button
            onClick={handleExport}
            disabled={exporting || isLoading}
            className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 transition disabled:opacity-50 font-medium text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterControls
        filters={filters}
        onFilterChange={handleFilterChange}
        actionTypes={actionTypes}
      />

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ui-text-2">No audit logs found</p>
          <p className="text-sm text-ui-text-muted mt-1">
            {logs.length === 0
              ? "No operations have been logged yet"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <AuditLogEntry
              key={log.id}
              log={log}
              expanded={expandedId === log.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === log.id ? null : log.id)
              }
            />
          ))}
        </div>
      )}

      {/* Load More Info */}
      {filteredLogs.length > 0 && filteredLogs.length < logs.length && (
        <div className="text-center text-xs text-ui-text-muted">
          Showing {filteredLogs.length} of {logs.length} entries
        </div>
      )}
    </div>
  );
};
export { AuditLogViewer };
export type { AuditLogViewerProps, AuditFilterOptions };
