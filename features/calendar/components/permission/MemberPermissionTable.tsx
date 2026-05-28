"use client";

import { useState, useCallback } from "react";
import { Trash2, Plus, Minus, User } from "lucide-react";
import { useNotify } from "@/features/dashboard/components/NotifyModal";

import type { CalendarMemberPermission } from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

interface MemberWithProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface MemberPermissionTableProps {
  members: Array<MemberWithProfile & { permission?: CalendarMemberPermission }>;
  onUpdatePermission: (
    memberId: string,
    permission: string,
    value: boolean,
  ) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onAddMember: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

interface PermissionToggleProps {
  memberId: string;
  permission: string;
  value: boolean;
  label: string;
  onToggle: (memberId: string, permission: string, value: boolean) => Promise<void>;
  loading?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearAll: () => void;
  onBulkUpdate: (permission: string, value: boolean) => Promise<void>;
  isLoading?: boolean;
}

// ============================================================================
// Permission Toggle Component
// ============================================================================

function PermissionToggle({
  memberId,
  permission,
  value,
  label,
  onToggle,
  loading = false,
}: PermissionToggleProps) {
  const [toggling, setToggling] = useState(false);

  const handleClick = async () => {
    setToggling(true);
    try {
      await onToggle(memberId, permission, !value);
    } finally {
      setToggling(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggling || loading}
      title={label}
      className={`
        flex items-center justify-center h-8 w-8 rounded transition-colors
        ${
          value
            ? "bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
            : "bg-[#2C2C2C] border border-[#2D2D2D] text-[#6B6A68] hover:border-[#404040]"
        }
        ${toggling || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {toggling ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : value ? (
        <Plus className="h-4 w-4" />
      ) : (
        <Minus className="h-4 w-4" />
      )}
    </button>
  );
}

// ============================================================================
// Bulk Action Bar Component
// ============================================================================

function BulkActionBar({
  selectedCount,
  onSelectAll,
  onClearAll,
  onBulkUpdate,
  isLoading = false,
}: BulkActionBarProps) {
  const [processing, setProcessing] = useState(false);

  if (selectedCount === 0) return null;

  const handleBulkGrant = async () => {
    setProcessing(true);
    try {
      await onBulkUpdate("all-permissions", true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
      <span className="text-sm text-blue-400">
        {selectedCount} member{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <div className="flex gap-2">
        <button
          onClick={onClearAll}
          disabled={processing || isLoading}
          className="px-3 py-1 text-xs rounded bg-[#2C2C2C] border border-[#2D2D2D] hover:border-[#404040] text-[#9B9A97] transition disabled:opacity-50"
        >
          Clear
        </button>
        <button
          onClick={handleBulkGrant}
          disabled={processing || isLoading}
          className="px-3 py-1 text-xs rounded bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 transition disabled:opacity-50"
        >
          {processing ? "Processing..." : "Grant All"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState({ onAddMember }: { onAddMember: () => void }) {
  return (
    <div className="text-center py-12">
      <User className="h-12 w-12 text-[#6B6A68] mx-auto mb-4 opacity-50" />
      <p className="text-[#9B9A97] mb-2">No members with permissions yet</p>
      <p className="text-sm text-[#6B6A68] mb-4">
        Add members to grant them access to this calendar
      </p>
      <button
        onClick={onAddMember}
        className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 transition text-sm font-medium"
      >
        Add Member
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Member permission table with CSS Grid layout.
 * Displays granular permissions for each team member.
 *
 * Features:
 * - Toggle individual permissions per member
 * - Bulk actions for multiple members
 * - Add/remove member access
 * - Loading states and error handling
 * - Responsive design without horizontal scroll
 */
const MemberPermissionTable = ({
  members,
  onUpdatePermission,
  onRemoveMember,
  onAddMember,
  isLoading = false,
  compact = false,
}: MemberPermissionTableProps) => {
  const { success, error } = useNotify();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(),
  );
  const [updatingMembers, setUpdatingMembers] = useState<Set<string>>(
    new Set(),
  );

  const handleUpdatePermission = useCallback(
    async (memberId: string, permission: string, value: boolean) => {
      setUpdatingMembers((prev) => new Set(prev).add(memberId));
      try {
        await onUpdatePermission(memberId, permission, value);
        success(`Permission updated`);
      } catch (err) {
        error(
          err instanceof Error ? err.message : "Failed to update permission",
        );
      } finally {
        setUpdatingMembers((prev) => {
          const next = new Set(prev);
          next.delete(memberId);
          return next;
        });
      }
    },
    [onUpdatePermission, success, error],
  );

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      setUpdatingMembers((prev) => new Set(prev).add(memberId));
      try {
        await onRemoveMember(memberId);
        success("Member removed");
        setSelectedMembers((prev) => {
          const next = new Set(prev);
          next.delete(memberId);
          return next;
        });
      } catch (err) {
        error(err instanceof Error ? err.message : "Failed to remove member");
      } finally {
        setUpdatingMembers((prev) => {
          const next = new Set(prev);
          next.delete(memberId);
          return next;
        });
      }
    },
    [onRemoveMember, success, error],
  );

  const toggleMemberSelection = (memberId: string) => {
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

  const toggleSelectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map((m) => m.id)));
    }
  };

  if (members.length === 0) {
    return <EmptyState onAddMember={onAddMember} />;
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {members.slice(0, 3).map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 rounded-lg bg-[#2C2C2C] border border-[#2D2D2D]"
          >
            <div>
              <p className="text-sm font-medium text-[#E5E2E1]">
                {member.display_name || member.username}
              </p>
              {member.permission && (
                <p className="text-xs text-[#6B6A68]">
                  {[
                    member.permission.can_view && "View",
                    member.permission.can_create_event && "Create",
                    member.permission.can_edit_event && "Edit",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
            <button
              onClick={() => handleRemoveMember(member.id)}
              className="p-2 rounded hover:bg-red-500/20 text-red-400 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {members.length > 3 && (
          <p className="text-xs text-[#6B6A68] px-2">
            +{members.length - 3} more
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {selectedMembers.size > 0 && (
        <BulkActionBar
          selectedCount={selectedMembers.size}
          onSelectAll={toggleSelectAll}
          onClearAll={() => setSelectedMembers(new Set())}
          onBulkUpdate={(permission, value) => onUpdatePermission("", permission, value)}
          isLoading={isLoading}
        />
      )}

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr_60px] gap-3 text-xs font-medium text-[#6B6A68] uppercase tracking-wider px-4 py-3 rounded-lg bg-[#1F1F1F] border border-[#2D2D2D]">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedMembers.size === members.length && members.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded cursor-pointer"
          />
        </div>
        <div>Member</div>
        <div>View</div>
        <div>Create</div>
        <div>Edit</div>
        <div>Delete</div>
        <div>Manage</div>
        <div className="text-center">Action</div>
      </div>

      {/* Table Body */}
      <div className="space-y-2">
        {members.map((member) => {
          const isUpdating = updatingMembers.has(member.id);
          const isSelected = selectedMembers.has(member.id);
          const perm = member.permission;

          return (
            <div
              key={member.id}
              className={`
                hidden md:grid grid-cols-[40px_1fr_1fr_1fr_1fr_1fr_1fr_60px] gap-3 items-center
                p-4 rounded-lg border transition-colors
                ${isSelected ? "bg-blue-500/10 border-blue-500/20" : "bg-[#2C2C2C] border-[#2D2D2D] hover:border-[#404040]"}
              `}
            >
              {/* Select Checkbox */}
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleMemberSelection(member.id)}
                  className="h-4 w-4 rounded cursor-pointer"
                  disabled={isUpdating}
                />
              </div>

              {/* Member Info */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#E5E2E1] truncate">
                  {member.display_name || member.username || "Unknown"}
                </p>
                {member.username && (
                  <p className="text-xs text-[#6B6A68] truncate">
                    @{member.username}
                  </p>
                )}
              </div>

              {/* Permission Toggles */}
              <PermissionToggle
                memberId={member.id}
                permission="view"
                value={perm?.can_view ?? false}
                label="Can view"
                onToggle={handleUpdatePermission}
                loading={isUpdating}
              />
              <PermissionToggle
                memberId={member.id}
                permission="create"
                value={perm?.can_create_event ?? false}
                label="Can create events"
                onToggle={handleUpdatePermission}
                loading={isUpdating}
              />
              <PermissionToggle
                memberId={member.id}
                permission="edit"
                value={perm?.can_edit_event ?? false}
                label="Can edit events"
                onToggle={handleUpdatePermission}
                loading={isUpdating}
              />
              <PermissionToggle
                memberId={member.id}
                permission="delete"
                value={perm?.can_delete_event ?? false}
                label="Can delete events"
                onToggle={handleUpdatePermission}
                loading={isUpdating}
              />
              <PermissionToggle
                memberId={member.id}
                permission="manage_permissions"
                value={perm?.can_manage_permissions ?? false}
                label="Can manage permissions"
                onToggle={handleUpdatePermission}
                loading={isUpdating}
              />

              {/* Delete Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={isUpdating || isLoading}
                  className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {members.map((member) => {
          const isUpdating = updatingMembers.has(member.id);
          const perm = member.permission;

          return (
            <div
              key={member.id}
              className="p-4 rounded-lg bg-[#2C2C2C] border border-[#2D2D2D] space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E5E2E1] truncate">
                    {member.display_name || member.username || "Unknown"}
                  </p>
                  {member.username && (
                    <p className="text-xs text-[#6B6A68] truncate">
                      @{member.username}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={isUpdating || isLoading}
                  className="p-2 rounded text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded hover:bg-[#1F1F1F] transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={perm?.can_view ?? false}
                    onChange={(e) =>
                      handleUpdatePermission(member.id, "view", e.target.checked)
                    }
                    disabled={isUpdating}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  <span className="text-xs text-[#9B9A97]">View</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded hover:bg-[#1F1F1F] transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={perm?.can_create_event ?? false}
                    onChange={(e) =>
                      handleUpdatePermission(member.id, "create", e.target.checked)
                    }
                    disabled={isUpdating}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  <span className="text-xs text-[#9B9A97]">Create</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded hover:bg-[#1F1F1F] transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={perm?.can_edit_event ?? false}
                    onChange={(e) =>
                      handleUpdatePermission(member.id, "edit", e.target.checked)
                    }
                    disabled={isUpdating}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  <span className="text-xs text-[#9B9A97]">Edit</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded hover:bg-[#1F1F1F] transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={perm?.can_delete_event ?? false}
                    onChange={(e) =>
                      handleUpdatePermission(member.id, "delete", e.target.checked)
                    }
                    disabled={isUpdating}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  <span className="text-xs text-[#9B9A97]">Delete</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Button */}
      <button
        onClick={onAddMember}
        disabled={isLoading}
        className="w-full px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 transition font-medium text-sm disabled:opacity-50"
      >
        <Plus className="h-4 w-4 inline mr-2" />
        Add Member
      </button>
    </div>
  );
};
export { MemberPermissionTable };
export type { MemberPermissionTableProps };
