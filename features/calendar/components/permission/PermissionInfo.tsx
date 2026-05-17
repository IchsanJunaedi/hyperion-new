"use client";

import { Copy, Eye, Plus, Edit2, Trash2, Lock } from "lucide-react";
import { useState } from "react";
import { useNotify } from "@/features/dashboard/components/NotifyModal";

import type {
  CalendarPermission,
  UserRole,
  CalendarVisibility,
} from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

interface PermissionInfoProps {
  userRole: UserRole;
  calendarVisibility: CalendarVisibility;
  userPermissions: Set<CalendarPermission>;
  calendarTitle: string;
  canRequestAccess?: boolean;
  onRequestAccess?: () => void;
  compact?: boolean;
}

interface PermissionBadgeProps {
  permission: CalendarPermission;
  granted: boolean;
  required?: boolean;
}

interface RoleBadgeProps {
  role: UserRole;
  compact?: boolean;
}

// ============================================================================
// Role Color Mapping
// ============================================================================

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; label: string }> = {
  owner: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    label: "Owner",
  },
  manager: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    label: "Manager",
  },
  coach: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    label: "Coach",
  },
  captain: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    label: "Captain",
  },
  member: {
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    label: "Member",
  },
};

const VISIBILITY_LABELS: Record<CalendarVisibility, string> = {
  private: "Private",
  "management-only": "Management Only",
  "captain-only": "Captain Only",
  "team-only": "Team",
  "selected-members": "Selected Members",
  "public-workspace": "Public Workspace",
};

const PERMISSION_ICONS: Record<CalendarPermission, React.ReactNode> = {
  view: <Eye className="h-4 w-4" />,
  "create-event": <Plus className="h-4 w-4" />,
  "edit-event": <Edit2 className="h-4 w-4" />,
  "delete-event": <Trash2 className="h-4 w-4" />,
  "manage-permissions": <Lock className="h-4 w-4" />,
  "manage-calendar": <Lock className="h-4 w-4" />,
};

const PERMISSION_LABELS: Record<CalendarPermission, string> = {
  view: "View",
  "create-event": "Create",
  "edit-event": "Edit",
  "delete-event": "Delete",
  "manage-permissions": "Manage Permissions",
  "manage-calendar": "Manage Calendar",
};

// ============================================================================
// Permission Badge Component
// ============================================================================

function PermissionBadge({
  permission,
  granted,
  required,
}: PermissionBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PERMISSION_LABELS[permission]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
        ${
          granted
            ? "bg-green-500/20 border-green-500/30 text-green-400"
            : "bg-red-500/20 border-red-500/30 text-red-400"
        }
      `}
      title={`${PERMISSION_LABELS[permission]}${required ? " (required for this action)" : ""}`}
    >
      {PERMISSION_ICONS[permission]}
      <span className="text-sm font-medium">{PERMISSION_LABELS[permission]}</span>
      {required && <span className="text-xs opacity-70">*</span>}
      <button
        onClick={handleCopy}
        className="ml-auto p-1 rounded hover:bg-white/10 transition"
        title="Copy permission name"
      >
        <Copy className="h-3 w-3" />
      </button>
      {copied && (
        <span className="absolute text-xs bg-black/80 px-2 py-1 rounded whitespace-nowrap">
          Copied!
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Role Badge Component
// ============================================================================

function RoleBadge({ role, compact = false }: RoleBadgeProps) {
  const roleInfo = ROLE_COLORS[role];

  if (compact) {
    return (
      <span
        className={`inline-block h-6 w-6 rounded-full ${roleInfo.bg} border ${roleInfo.text} border-current flex items-center justify-center text-xs font-bold`}
        title={roleInfo.label}
      >
        {role[0]?.toUpperCase() ?? ""}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${roleInfo.bg} ${roleInfo.text} border-current/30`}
    >
      {roleInfo.label}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PermissionInfo({
  userRole,
  calendarVisibility,
  userPermissions,
  calendarTitle,
  canRequestAccess = false,
  onRequestAccess,
  compact = false,
}: PermissionInfoProps) {
  const { success } = useNotify();
  const [copied, setCopied] = useState(false);

  const roleInfo = ROLE_COLORS[userRole];
  const visibilityLabel = VISIBILITY_LABELS[calendarVisibility];

  // Get all possible permissions for reference
  const allPermissions: CalendarPermission[] = [
    "view",
    "create-event",
    "edit-event",
    "delete-event",
    "manage-permissions",
    "manage-calendar",
  ];

  const handleCopyPermissions = () => {
    const permList = Array.from(userPermissions)
      .map((p) => PERMISSION_LABELS[p])
      .join(", ");
    const summary = `Calendar: ${calendarTitle}
Role: ${ROLE_COLORS[userRole].label}
Visibility: ${visibilityLabel}
Permissions: ${permList || "None"}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2C2C2C] border border-[#2D2D2D]">
        <RoleBadge role={userRole} compact />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#6B6A68]">Your Role</p>
          <p className="text-sm font-medium text-[#E5E2E1] truncate">
            {roleInfo.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userPermissions.has("view") && (
            <Eye className="h-4 w-4 text-green-400" aria-label="Can view" />
          )}
          {userPermissions.has("create-event") && (
            <Plus className="h-4 w-4 text-blue-400" aria-label="Can create" />
          )}
          {userPermissions.has("manage-permissions") && (
            <Lock className="h-4 w-4 text-purple-400" aria-label="Can manage" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 rounded-xl bg-[#202020] border border-[#2D2D2D]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#E5E2E1]">
            Your Permissions
          </h3>
          <p className="text-sm text-[#6B6A68] mt-1">
            {calendarTitle}
          </p>
        </div>
        <button
          onClick={handleCopyPermissions}
          className="p-2 rounded-lg bg-[#2C2C2C] border border-[#2D2D2D] hover:border-[#404040] text-[#9B9A97] hover:text-[#E5E2E1] transition"
          title="Copy permission summary"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>

      {/* Role and Visibility Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#6B6A68] uppercase tracking-wider">
            Your Role
          </p>
          <RoleBadge role={userRole} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#6B6A68] uppercase tracking-wider">
            Visibility Level
          </p>
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-[#2C2C2C] border border-[#2D2D2D] text-[#E5E2E1]">
            {visibilityLabel}
          </span>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-[#6B6A68] uppercase tracking-wider">
          Your Permissions
        </p>
        <div className="grid grid-cols-1 gap-2">
          {allPermissions.map((perm) => (
            <PermissionBadge
              key={perm}
              permission={perm}
              granted={userPermissions.has(perm)}
            />
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-blue-400">
          {userPermissions.size === 0
            ? "You don't have access to this calendar. Contact your manager or calendar owner."
            : userPermissions.has("manage-permissions")
              ? "You can manage permissions for this calendar. Click 'Edit Permissions' to add or modify member access."
              : userPermissions.has("create-event")
                ? "You can view and create events in this calendar."
                : "You can view events in this calendar."}
        </p>
      </div>

      {/* Request Access Button */}
      {canRequestAccess && userPermissions.size === 0 && (
        <button
          onClick={onRequestAccess}
          className="w-full px-4 py-2 rounded-lg bg-[#2C2C2C] border border-[#2D2D2D] hover:border-[#404040] text-[#E5E2E1] transition font-medium"
        >
          Request Access
        </button>
      )}

      {/* Copied Toast */}
      {copied && (
        <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
          Permission summary copied!
        </div>
      )}
    </div>
  );
}

export type { PermissionInfoProps };
