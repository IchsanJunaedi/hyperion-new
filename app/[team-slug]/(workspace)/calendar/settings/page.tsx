"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Settings, Eye, Users, History, Trash2, Loading } from "lucide-react";
import Link from "next/link";

import { useAccessibleCalendars } from "@/features/calendar/hooks/useCalendarPermissions";
import { usePermissionContext } from "@/features/calendar/hooks/usePermissionContext";
import type { AccessibleCalendarResult } from "@/features/calendar/hooks/useCalendarPermissions";

// ============================================================================
// Tab Navigation
// ============================================================================

type TabType = "overview" | "visibility" | "members" | "audit";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Ikhtisar", icon: Settings },
  { id: "visibility", label: "Visibilitas", icon: Eye },
  { id: "members", label: "Anggota", icon: Users },
  { id: "audit", label: "Audit", icon: History },
];

// ============================================================================
// Tab Content Components
// ============================================================================

interface TabContentProps {
  calendar: AccessibleCalendarResult;
  teamSlug: string;
}

/**
 * Overview Tab - Show calendar info and stats
 */
function OverviewTab({ calendar, teamSlug }: TabContentProps) {
  return (
    <div className="space-y-6">
      {/* Calendar Info Card */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Informasi Kalender
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Judul
            </label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{calendar.title}</p>
          </div>
          {calendar.description && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Deskripsi
              </label>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                {calendar.description}
              </p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Visibilitas
            </label>
            <p className="mt-1 inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-900 dark:text-blue-200">
              {calendar.visibility}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Status
            </label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">
              {calendar.is_active ? "Aktif" : "Nonaktif"}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Card */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Statistik
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Event</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {calendar.eventCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Dibuat</p>
            <p className="mt-2 text-sm text-gray-900 dark:text-gray-100">
              {new Date(calendar.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
          Zona Berbahaya
        </h3>
        <p className="text-sm text-red-800 dark:text-red-300 mb-4">
          Tindakan di bawah ini tidak dapat diubah.
        </p>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">
          <Trash2 className="h-4 w-4" />
          Hapus Kalender
        </button>
      </div>
    </div>
  );
}

/**
 * Visibility Tab - Manage calendar visibility
 */
function VisibilityTab({ calendar, teamSlug }: TabContentProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Atur Visibilitas Kalender
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Pilih siapa yang dapat melihat kalender ini dan event-eventnya.
      </p>
      <div className="space-y-3">
        {[
          { value: "private", label: "Pribadi", description: "Hanya Anda" },
          { value: "management-only", label: "Manajemen", description: "Owner, Manager, Coach" },
          { value: "team-only", label: "Tim", description: "Semua anggota tim" },
          { value: "public-workspace", label: "Publik", description: "Semua di organisasi" },
        ].map((option) => (
          <label
            key={option.value}
            className="flex items-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <input
              type="radio"
              name="visibility"
              value={option.value}
              defaultChecked={calendar.visibility === option.value}
              className="h-4 w-4"
            />
            <div className="ml-3 flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {option.label}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {option.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Members Tab - Manage member permissions
 */
function MembersTab({ calendar, teamSlug }: TabContentProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Izin Anggota
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Kelola siapa yang dapat mengakses dan mengelola kalender ini.
      </p>
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Member permissions feature akan segera hadir
      </div>
    </div>
  );
}

/**
 * Audit Tab - View audit logs
 */
function AuditTab({ calendar, teamSlug }: TabContentProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Riwayat Audit
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Lihat semua perubahan yang dilakukan pada kalender ini.
      </p>
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Audit logs akan segera hadir
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function CalendarSettingsPage() {
  const params = useParams();
  const teamSlug = params["team-slug"] as string;
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const { calendars, isLoading, error } = useAccessibleCalendars(teamSlug);
  const { canManageCalendars, isLoading: permLoading } = usePermissionContext(teamSlug);

  // Check if user can manage calendars
  if (!permLoading && !canManageCalendars) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Akses Ditolak
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <Link
          href={`/${teamSlug}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Kembali ke Workspace
        </Link>
      </div>
    );
  }

  // Get first manageable calendar (default)
  const manageableCalendars = calendars.filter((cal) => cal.canManage);
  const selectedCalendar = manageableCalendars[0];

  if (isLoading || permLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200">
        Gagal memuat kalender: {error.message}
      </div>
    );
  }

  if (manageableCalendars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Tidak Ada Kalender
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Anda belum membuat atau mengelola kalender apapun.
        </p>
        <Link
          href={`/${teamSlug}/calendar/new`}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Buat Kalender
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header with Breadcrumb */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Link
              href={`/${teamSlug}`}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Workspace
            </Link>
            <span>/</span>
            <Link
              href={`/${teamSlug}/calendar`}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Kalender
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100">Pengaturan</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Pengaturan Kalender
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Calendar List */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">
                Kalender Saya
              </h2>
              <div className="space-y-2">
                {manageableCalendars.map((cal) => (
                  <button
                    key={cal.id}
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCalendar?.id === cal.id
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <p className="font-medium">{cal.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {cal.eventCount} event
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex gap-8 overflow-x-auto">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                          : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="rounded-lg bg-white dark:bg-gray-900 p-6">
              {selectedCalendar ? (
                <>
                  {activeTab === "overview" && (
                    <OverviewTab calendar={selectedCalendar} teamSlug={teamSlug} />
                  )}
                  {activeTab === "visibility" && (
                    <VisibilityTab calendar={selectedCalendar} teamSlug={teamSlug} />
                  )}
                  {activeTab === "members" && (
                    <MembersTab calendar={selectedCalendar} teamSlug={teamSlug} />
                  )}
                  {activeTab === "audit" && (
                    <AuditTab calendar={selectedCalendar} teamSlug={teamSlug} />
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Pilih kalender untuk melihat pengaturannya
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
