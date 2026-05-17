"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

import type { CalendarPermission } from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

interface PermissionGuardProps {
  requiredPermission: CalendarPermission | CalendarPermission[];
  calendarId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs at least one.
}

interface PermissionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  requiredPermission: CalendarPermission | CalendarPermission[];
  calendarId: string;
  children: React.ReactNode;
  failedText?: string;
  requireAll?: boolean;
  onPermissionDenied?: () => void;
}

interface PermissionConfirmDialogProps {
  requiredPermission: CalendarPermission;
  calendarId: string;
  action: string;
  children: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if user has required permission(s).
 * This is a client-side check - RLS provides backend enforcement.
 */
async function checkPermission(
  calendarId: string,
  requiredPermission: CalendarPermission | CalendarPermission[],
  requireAll = false,
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/calendars/${calendarId}/check-permission`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: Array.isArray(requiredPermission)
            ? requiredPermission
            : [requiredPermission],
          requireAll,
        }),
      },
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.allowed === true;
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

// ============================================================================
// Permission Guard Component
// ============================================================================

/**
 * Wrapper component for permission-gated content.
 * Only renders children if user has required permission.
 *
 * @example
 * <PermissionGuard requiredPermission="edit-event" calendarId={calendarId}>
 *   <EditEventForm />
 * </PermissionGuard>
 */
export function PermissionGuard({
  requiredPermission,
  calendarId,
  children,
  fallback,
  requireAll = false,
}: PermissionGuardProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      const hasPermission = await checkPermission(
        calendarId,
        requiredPermission,
        requireAll,
      );
      setAllowed(hasPermission);
      setLoading(false);
    };

    checkAccess();
  }, [calendarId, requiredPermission, requireAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6B6A68] border-t-[#E5E2E1]" />
      </div>
    );
  }

  if (!allowed) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-400">Access Denied</p>
            <p className="text-sm text-red-300 mt-1">
              You don&apos;t have permission to perform this action.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ============================================================================
// Permission Button Component
// ============================================================================

/**
 * Button component with built-in permission checking.
 * Disables button and shows message if user lacks permission.
 *
 * @example
 * <PermissionButton
 *   requiredPermission="create-event"
 *   calendarId={calendarId}
 *   onClick={handleCreate}
 * >
 *   Create Event
 * </PermissionButton>
 */
export function PermissionButton({
  requiredPermission,
  calendarId,
  children,
  failedText = "No permission",
  requireAll = false,
  onPermissionDenied,
  disabled,
  title,
  ...props
}: PermissionButtonProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      const hasPermission = await checkPermission(
        calendarId,
        requiredPermission,
        requireAll,
      );
      setAllowed(hasPermission);
      if (!hasPermission && onPermissionDenied) {
        onPermissionDenied();
      }
      setLoading(false);
    };

    checkAccess();
  }, [calendarId, requiredPermission, requireAll, onPermissionDenied]);

  const isDisabled = loading || !allowed || disabled;
  const displayTitle =
    !allowed && !loading
      ? failedText
      : title;

  return (
    <button
      disabled={isDisabled}
      title={displayTitle}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        ${
          isDisabled
            ? "bg-[#2C2C2C] text-[#6B6A68] cursor-not-allowed opacity-50"
            : "bg-[#2C2C2C] border border-[#2D2D2D] text-[#E5E2E1] hover:border-[#404040] cursor-pointer"
        }
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#6B6A68] border-t-[#E5E2E1]" />
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// ============================================================================
// Permission Confirm Dialog Component
// ============================================================================

/**
 * Dialog wrapper for permission-gated actions with confirmation.
 * Shows a confirmation dialog only if user has required permission.
 *
 * @example
 * <PermissionConfirmDialog
 *   requiredPermission="manage-permissions"
 *   calendarId={calendarId}
 *   action="grant_permission"
 *   onConfirm={handleGrant}
 * >
 *   <p>Are you sure you want to grant access?</p>
 * </PermissionConfirmDialog>
 */
export function PermissionConfirmDialog({
  requiredPermission,
  calendarId,
  action,
  children,
  onConfirm,
  onCancel,
  loading = false,
}: PermissionConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (open) {
      const checkAccess = async () => {
        setChecking(true);
        const hasPermission = await checkPermission(
          calendarId,
          requiredPermission,
          false,
        );
        setAllowed(hasPermission);
        setChecking(false);
      };

      checkAccess();
    }
  }, [open, calendarId, requiredPermission]);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
  };

  if (!allowed && open) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-6 max-w-sm mx-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#E5E2E1]">Permission Denied</h3>
              <p className="text-sm text-[#9B9A97] mt-2">
                You don&apos;t have permission to perform this action.
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="w-full mt-4 px-4 py-2 rounded-lg bg-[#2C2C2C] border border-[#2D2D2D] hover:border-[#404040] text-[#E5E2E1] transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={checking || loading}
        className="px-4 py-2 rounded-lg bg-[#2C2C2C] border border-[#2D2D2D] hover:border-[#404040] text-[#E5E2E1] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checking ? "Checking..." : action}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-6 max-w-sm mx-4">
            <div className="mb-4">{children}</div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-[#2C2C2C] border border-[#2D2D2D] hover:border-[#404040] text-[#E5E2E1] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export type {
  PermissionGuardProps,
  PermissionButtonProps,
  PermissionConfirmDialogProps,
};
