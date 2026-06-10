"use client";

import { useState, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
} from "lucide-react";
import { useNotify } from "@/features/dashboard/components/NotifyModal";

import type {
  CalendarVisibility,
} from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

interface TeamMember {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface EventVisibilityOverrideProps {
  eventId: string;
  eventTitle: string;
  calendarVisibility: CalendarVisibility;
  currentOverride?: CalendarVisibility;
  currentOverrideMembers?: string[];
  teamMembers?: TeamMember[];
  onSave: (
    visibility: CalendarVisibility,
    selectedMembers?: string[],
  ) => Promise<void>;
  isLoading?: boolean;
}

interface VisibilityOption {
  value: CalendarVisibility;
  label: string;
  description: string;
}

// ============================================================================
// Visibility Options Configuration
// ============================================================================

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: "private",
    label: "Private",
    description: "Only you can see this event",
  },
  {
    value: "management-only",
    label: "Management Only",
    description: "Visible to owner, manager, and coach",
  },
  {
    value: "captain-only",
    label: "Captain Only",
    description: "Visible to management and captain",
  },
  {
    value: "team-only",
    label: "Team Only",
    description: "Visible to all team members",
  },
  {
    value: "selected-members",
    label: "Selected Members",
    description: "Visible only to selected members",
  },
  {
    value: "public-workspace",
    label: "Public Workspace",
    description: "Visible to all organization members",
  },
];

// ============================================================================
// Visibility Diff Component
// ============================================================================

interface VisibilityDiffProps {
  calendarVisibility: CalendarVisibility;
  eventVisibility: CalendarVisibility;
}

function VisibilityDiff({
  calendarVisibility,
  eventVisibility,
}: VisibilityDiffProps) {
  const calendarLabel =
    VISIBILITY_OPTIONS.find((o) => o.value === calendarVisibility)?.label ||
    "Unknown";
  const eventLabel =
    VISIBILITY_OPTIONS.find((o) => o.value === eventVisibility)?.label ||
    "Unknown";

  return (
    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
      <p className="text-xs font-medium text-ui-text-muted uppercase tracking-wider mb-2">
        Visibility Comparison
      </p>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex-1">
          <p className="text-ui-text-2">Calendar Default</p>
          <p className="font-medium text-ui-text">{calendarLabel}</p>
        </div>
        <div className="text-ui-text-muted">→</div>
        <div className="flex-1">
          <p className="text-ui-text-2">Event Override</p>
          <p className="font-medium text-ui-text">{eventLabel}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Member Selector Component
// ============================================================================

interface MemberSelectorProps {
  members: TeamMember[];
  selectedMembers: Set<string>;
  onToggleMember: (memberId: string) => void;
}

function MemberSelector({
  members,
  selectedMembers,
  onToggleMember,
}: MemberSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return members;
    return members.filter(
      (m) =>
        m.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.username?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [members, search]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-ui-text-muted uppercase tracking-wider">
        Select Members
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ui-text-muted" />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-ui-hover border border-ui-border focus:border-[#404040] text-ui-text placeholder-ui-text-muted outline-none transition"
        />
      </div>

      {/* Member List */}
      <div className="max-h-48 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-4 text-ui-text-muted text-sm">
            No members found
          </div>
        ) : (
          filtered.map((member) => {
            const isSelected = selectedMembers.has(member.id);
            return (
              <label
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-ui-hover cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleMember(member.id)}
                  className="h-4 w-4 rounded border-ui-border bg-ui-hover cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ui-text truncate">
                    {member.display_name || member.username}
                  </p>
                  {member.username && (
                    <p className="text-xs text-ui-text-muted truncate">
                      @{member.username}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Event-level visibility override component.
 * Allows setting a different visibility for a specific event than its calendar default.
 */
const EventVisibilityOverride = ({
  eventId,
  eventTitle,
  calendarVisibility,
  currentOverride,
  currentOverrideMembers = [],
  teamMembers = [],
  onSave,
  isLoading = false,
}: EventVisibilityOverrideProps) => {
  const { success, error } = useNotify();
  const [visibility, setVisibility] = useState<CalendarVisibility>(
    currentOverride || calendarVisibility,
  );
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(currentOverrideMembers),
  );
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasOverride = currentOverride !== undefined && currentOverride !== calendarVisibility;
  const hasChanges =
    visibility !== (currentOverride || calendarVisibility) ||
    selectedMembers.size !== new Set(currentOverrideMembers).size;

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      if (
        visibility === "selected-members" &&
        selectedMembers.size === 0
      ) {
        error("Please select at least one member");
        return;
      }

      setSaving(true);
      await onSave(
        visibility,
        visibility === "selected-members"
          ? Array.from(selectedMembers)
          : undefined,
      );
      success(
        `Event visibility ${visibility === calendarVisibility ? "reset" : "updated"}`,
      );
      setShowConfirm(false);
    } catch (err) {
      error(
        err instanceof Error
          ? err.message
          : "Failed to update visibility",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setVisibility(calendarVisibility);
    setSelectedMembers(new Set());
  };

  return (
    <div className="space-y-6 p-6 rounded-xl bg-ui-surface border border-ui-border">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-ui-text">
          Event Visibility
        </h3>
        <p className="text-sm text-ui-text-muted mt-1">
          {eventTitle}
        </p>
      </div>

      {/* Applied Indicator */}
      {hasOverride && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-400 text-sm">
              Override Applied
            </p>
            <p className="text-xs text-green-300 mt-1">
              This event has a different visibility than the calendar default.
            </p>
          </div>
        </div>
      )}

      {/* Calendar Default Info */}
      <div className="p-3 rounded-lg bg-ui-hover border border-ui-border">
        <p className="text-xs font-medium text-ui-text-muted uppercase tracking-wider mb-2">
          Calendar Default
        </p>
        <div className="space-y-1">
          <p className="text-sm font-medium text-ui-text">
            {
              VISIBILITY_OPTIONS.find((o) => o.value === calendarVisibility)
                ?.label
            }
          </p>
          <p className="text-xs text-ui-text-2">
            {
              VISIBILITY_OPTIONS.find((o) => o.value === calendarVisibility)
                ?.description
            }
          </p>
        </div>
      </div>

      {/* Visibility Options */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-ui-text-muted uppercase tracking-wider">
          Override Visibility
        </p>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition"
              style={{
                borderColor:
                  visibility === option.value
                    ? "#404040"
                    : "#2D2D2D",
                backgroundColor:
                  visibility === option.value
                    ? "#2C2C2C"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="event-visibility"
                value={option.value}
                checked={visibility === option.value}
                onChange={(e) =>
                  setVisibility(e.target.value as CalendarVisibility)
                }
                className="mt-1 h-4 w-4 cursor-pointer"
              />
              <div className="flex-1">
                <p className="font-medium text-ui-text">{option.label}</p>
                <p className="text-sm text-ui-text-2 mt-0.5">
                  {option.description}
                </p>
              </div>
              {visibility === option.value &&
                option.value === calendarVisibility && (
                  <span className="text-xs text-ui-text-muted font-medium">
                    (Calendar default)
                  </span>
                )}
            </label>
          ))}
        </div>
      </div>

      {/* Member Selection for selected-members */}
      {visibility === "selected-members" && teamMembers.length > 0 && (
        <div className="p-4 rounded-lg bg-ui-surface border border-ui-border">
          <MemberSelector
            members={teamMembers}
            selectedMembers={selectedMembers}
            onToggleMember={handleToggleMember}
          />
        </div>
      )}

      {/* Visibility Diff */}
      {visibility !== calendarVisibility && (
        <VisibilityDiff
          calendarVisibility={calendarVisibility}
          eventVisibility={visibility}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!hasChanges || saving || isLoading}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? "Saving..." : "Apply Override"}
        </button>
        {hasOverride && (
          <button
            onClick={handleReset}
            disabled={saving || isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-ui-hover border border-ui-border hover:border-[#404040] text-ui-text transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <RotateCcw className="h-4 w-4 inline mr-2" />
            Reset to Calendar Default
          </button>
        )}
      </div>

      {/* Info Message */}
      {visibility !== calendarVisibility && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400">
            This event will have different visibility than the calendar. The
            override will apply only to this event.
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl border border-ui-border bg-ui-surface p-6 max-w-sm mx-4 space-y-4">
            <div>
              <h3 className="font-semibold text-ui-text">
                Confirm Visibility Override
              </h3>
              <p className="text-sm text-ui-text-2 mt-2">
                Are you sure you want to change this event&apos;s visibility?
              </p>
            </div>

            <div className="p-3 rounded-lg bg-ui-surface border border-ui-border text-sm">
              <p className="text-ui-text-muted text-xs mb-1">New visibility:</p>
              <p className="text-ui-text font-medium">
                {
                  VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label
                }
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-ui-hover border border-ui-border hover:border-[#404040] text-ui-text transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export { EventVisibilityOverride };
export type { EventVisibilityOverrideProps };
