"use client";

import { useState, useCallback, useMemo } from "react";
import { AlertCircle, CheckCircle2, XCircle, Search } from "lucide-react";
import { useNotify } from "@/features/dashboard/components/NotifyModal";

import type {
  CalendarVisibility,
  UserRole,
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

interface VisibilityManagerProps {
  currentVisibility: CalendarVisibility;
  selectedMembers?: string[];
  teamMembers?: TeamMember[];
  onSave: (
    visibility: CalendarVisibility,
    selectedMembers?: string[],
  ) => Promise<void>;
  isLoading?: boolean;
  compact?: boolean;
}

interface VisibilityOption {
  value: CalendarVisibility;
  label: string;
  description: string;
  viewableBy: UserRole[];
  restricted?: boolean;
}

// ============================================================================
// Visibility Options Configuration
// ============================================================================

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: "private",
    label: "Private",
    description: "Only you can see and edit this calendar",
    viewableBy: ["owner", "captain", "coach", "manager"],
  },
  {
    value: "management-only",
    label: "Management Only",
    description: "Visible to owner, manager, and coach",
    viewableBy: ["owner", "manager", "coach"],
  },
  {
    value: "captain-only",
    label: "Captain Only",
    description: "Visible to management and captain",
    viewableBy: ["owner", "manager", "coach", "captain"],
  },
  {
    value: "team-only",
    label: "Team Only",
    description: "Visible to all team members",
    viewableBy: ["owner", "manager", "coach", "captain", "member"],
  },
  {
    value: "selected-members",
    label: "Selected Members",
    description: "Visible only to selected team members",
    viewableBy: ["owner", "manager", "coach", "captain"],
  },
  {
    value: "public-workspace",
    label: "Public Workspace",
    description: "Visible to all organization members",
    viewableBy: ["owner", "manager", "coach", "captain", "member"],
  },
];

// ============================================================================
// Permission Matrix Component
// ============================================================================

interface PermissionMatrixProps {
  visibility: CalendarVisibility;
  selectedMembersCount?: number;
}

function PermissionMatrix({
  visibility,
  selectedMembersCount,
}: PermissionMatrixProps) {
  const option = VISIBILITY_OPTIONS.find((o) => o.value === visibility);

  const canView = (role: UserRole) => option?.viewableBy.includes(role) ?? false;
  const canCreate = (role: UserRole) =>
    ["owner", "manager", "coach", "captain"].includes(role) &&
    (visibility !== "team-only" || role !== "member");
  const canManage = (role: UserRole) =>
    ["owner", "manager", "coach"].includes(role);

  const roles: UserRole[] = [
    "owner",
    "manager",
    "coach",
    "captain",
    "member",
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-ui-text-muted uppercase tracking-wider">
        Preview Permissions
      </p>

      <div className="grid grid-cols-[100px_1fr_1fr_1fr] gap-2 text-xs">
        {/* Header */}
        <div className="font-medium text-ui-text-2">Role</div>
        <div className="font-medium text-ui-text-2">View</div>
        <div className="font-medium text-ui-text-2">Create</div>
        <div className="font-medium text-ui-text-2">Manage</div>

        {/* Rows */}
        {roles.map((role) => (
          <div key={role} className="contents">
            <div className="text-ui-text">{role}</div>
            <div>
              {canView(role) ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
            <div>
              {canCreate(role) ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
            <div>
              {canManage(role) ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {visibility === "selected-members" && selectedMembersCount !== undefined && (
        <div className="mt-3 p-2 rounded bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-400">
            {selectedMembersCount} member{selectedMembersCount !== 1 ? "s" : ""}{" "}
            selected
          </p>
        </div>
      )}
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
  onSelectAll?: () => void;
  onClearAll?: () => void;
}

function MemberSelector({
  members,
  selectedMembers,
  onToggleMember,
  onSelectAll,
  onClearAll,
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
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ui-text-muted uppercase tracking-wider">
          Select Members
        </p>
        <div className="flex gap-2">
          {onSelectAll && (
            <button
              onClick={onSelectAll}
              className="text-xs px-2 py-1 rounded bg-ui-hover border border-ui-border hover:border-[#404040] text-ui-text-2 hover:text-ui-text transition"
            >
              All
            </button>
          )}
          {onClearAll && (
            <button
              onClick={onClearAll}
              className="text-xs px-2 py-1 rounded bg-ui-hover border border-ui-border hover:border-[#404040] text-ui-text-2 hover:text-ui-text transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

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
      <div className="max-h-64 overflow-y-auto space-y-2">
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

const VisibilityManager = ({
  currentVisibility,
  selectedMembers: initialSelectedMembers = [],
  teamMembers = [],
  onSave,
  isLoading = false,
  compact = false,
}: VisibilityManagerProps) => {
  const { success, error } = useNotify();
  const [visibility, setVisibility] = useState<CalendarVisibility>(
    currentVisibility,
  );
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(initialSelectedMembers),
  );
  const [saving, setSaving] = useState(false);

  const handleToggleMember = useCallback((memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    setSelectedMembers(new Set(teamMembers.map((m) => m.id)));
  };

  const handleClearAll = () => {
    setSelectedMembers(new Set());
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
        `Calendar visibility updated to ${VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label}`,
      );
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

  const hasChanges =
    visibility !== currentVisibility ||
    selectedMembers.size !==
      new Set(initialSelectedMembers).size;

  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-ui-hover border border-ui-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ui-text-muted">Visibility</p>
            <p className="text-sm font-medium text-ui-text">
              {
                VISIBILITY_OPTIONS.find((o) => o.value === currentVisibility)
                  ?.label
              }
            </p>
          </div>
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 transition text-sm"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 rounded-xl bg-ui-surface border border-ui-border">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-ui-text">
          Visibility Settings
        </h3>
        <p className="text-sm text-ui-text-muted mt-1">
          Control who can see and access this calendar
        </p>
      </div>

      {/* Visibility Options */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-ui-text-muted uppercase tracking-wider">
          Select Visibility Level
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
                name="visibility"
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
            </label>
          ))}
        </div>
      </div>

      {/* Member Selection for selected-members */}
      {visibility === "selected-members" && teamMembers.length > 0 && (
        <div className="space-y-3 p-4 rounded-lg bg-ui-surface border border-ui-border">
          <MemberSelector
            members={teamMembers}
            selectedMembers={selectedMembers}
            onToggleMember={handleToggleMember}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
          />
        </div>
      )}

      {visibility === "selected-members" && teamMembers.length === 0 && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400">
              No team members available for selection
            </p>
          </div>
        </div>
      )}

      {/* Permission Matrix */}
      <div className="p-4 rounded-lg bg-ui-surface border border-ui-border">
        <PermissionMatrix
          visibility={visibility}
          selectedMembersCount={selectedMembers.size}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving || (isLoading as boolean)}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={() => {
            setVisibility(currentVisibility);
            setSelectedMembers(new Set(initialSelectedMembers));
          }}
          disabled={!hasChanges || saving}
          className="flex-1 px-4 py-2 rounded-lg bg-ui-hover border border-ui-border hover:border-[#404040] text-ui-text transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Reset
        </button>
      </div>

      {/* Info Message */}
      {hasChanges && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-400">
            You have unsaved changes. Click &apos;Save Changes&apos; to apply them.
          </p>
        </div>
      )}
    </div>
  );
};
export { VisibilityManager };
export type { VisibilityManagerProps };
