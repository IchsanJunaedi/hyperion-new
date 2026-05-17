"use client";

import { useState } from "react";
import { X, AlertCircle, Check } from "lucide-react";

import { useEventPermission } from "@/features/calendar/hooks/useEventPermission";
import type { EventVisibility, CalendarVisibility } from "@/lib/permissions/calendar-types";

// ============================================================================
// Type Definitions
// ============================================================================

interface EventPermissionModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onPermissionChange?: (visibility: EventVisibility) => void;
}

interface VisibilityOption {
  value: CalendarVisibility;
  label: string;
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: "private",
    label: "Pribadi",
    description: "Hanya Anda yang bisa melihat",
  },
  {
    value: "management-only",
    label: "Manajemen Saja",
    description: "Owner, Manager, Coach",
  },
  {
    value: "captain-only",
    label: "Kapten Saja",
    description: "Owner, Manager, Coach, Kapten",
  },
  {
    value: "team-only",
    label: "Tim",
    description: "Semua anggota tim",
  },
  {
    value: "selected-members",
    label: "Anggota Terpilih",
    description: "Hanya anggota yang dipilih",
  },
  {
    value: "public-workspace",
    label: "Publik (Workspace)",
    description: "Semua anggota organisasi",
  },
];

// ============================================================================
// EventVisibilityOverride Component
// ============================================================================

/**
 * Shows when event visibility differs from calendar visibility
 */
function EventVisibilityOverride({
  eventVisibility,
  calendarVisibility,
}: {
  eventVisibility: CalendarVisibility;
  calendarVisibility: CalendarVisibility;
}) {
  if (eventVisibility === calendarVisibility) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500 mt-0.5" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-yellow-900 dark:text-yellow-100">
          Visibilitas Override Aktif
        </p>
        <p className="text-yellow-800 dark:text-yellow-200 mt-1">
          Event ini memiliki visibilitas yang berbeda dari kalender. Kalender: <strong>{calendarVisibility}</strong>, Event: <strong>{eventVisibility}</strong>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// PermissionBreakdown Component
// ============================================================================

/**
 * Shows who can see this event
 */
function PermissionBreakdown({
  visibility,
  allowedMembers,
}: {
  visibility: CalendarVisibility;
  allowedMembers: string[];
}) {
  const getRoles = (visibility: CalendarVisibility): string[] => {
    switch (visibility) {
      case "private":
        return ["Pencipta Event"];
      case "management-only":
        return ["Owner", "Manager", "Coach"];
      case "captain-only":
        return ["Owner", "Manager", "Coach", "Kapten"];
      case "team-only":
        return ["Semua Anggota Tim"];
      case "selected-members":
        return allowedMembers.length > 0 ? allowedMembers : ["Tidak ada anggota"];
      case "public-workspace":
        return ["Semua Anggota Organisasi"];
      default:
        return [];
    }
  };

  const roles = getRoles(visibility);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Siapa yang Bisa Melihat Event Ini
      </h4>
      <div className="space-y-2">
        {roles.map((role, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
            <span>{role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Event permission management modal
 * Shows visibility level, override indicators, and permission breakdown
 */
export function EventPermissionModal({
  eventId,
  isOpen,
  onClose,
  onPermissionChange,
}: EventPermissionModalProps) {
  const [selectedVisibility, setSelectedVisibility] = useState<CalendarVisibility | null>(null);
  const { visibility, calendarVisibility, isOverridden, allowedMembers, isLoading, error, setEventVisibility } = useEventPermission(eventId);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleVisibilityChange = async (newVisibility: CalendarVisibility) => {
    setSelectedVisibility(newVisibility);
    setIsUpdating(true);

    try {
      await setEventVisibility({
        id: "",
        organization_id: "",
        event_id: eventId,
        calendar_id: null,
        visibility: newVisibility,
        allowed_member_ids: allowedMembers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: "",
        updated_by: null,
      });

      onPermissionChange?.({
        id: "",
        organization_id: "",
        event_id: eventId,
        calendar_id: null,
        visibility: newVisibility,
        allowed_member_ids: allowedMembers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: "",
        updated_by: null,
      });
    } catch (err) {
      console.error("Failed to update visibility:", err);
    } finally {
      setIsUpdating(false);
      setSelectedVisibility(null);
    }
  };

  const currentVisibility = ((visibility as unknown as string) || "team-only") as CalendarVisibility;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Visibilitas Event
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-4 max-h-96 overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-200">
              Gagal memuat informasi visibilitas
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100" />
            </div>
          ) : (
            <>
              {isOverridden && (
                <EventVisibilityOverride
                  eventVisibility={currentVisibility}
                  calendarVisibility={calendarVisibility}
                />
              )}

              {/* Current Visibility Display */}
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Visibilitas Saat Ini
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {VISIBILITY_OPTIONS.find(v => v.value === currentVisibility)?.label || currentVisibility}
                </p>
              </div>

              {/* Visibility Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Ubah Visibilitas
                </p>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleVisibilityChange(option.value)}
                      disabled={isUpdating || isLoading}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentVisibility === option.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission Breakdown */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <PermissionBreakdown
                  visibility={currentVisibility}
                  allowedMembers={allowedMembers}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}
