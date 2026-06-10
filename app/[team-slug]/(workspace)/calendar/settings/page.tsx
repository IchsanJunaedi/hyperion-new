"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Settings, Eye, Users, History, Trash2 } from "lucide-react";
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

function OverviewTab({ calendar }: TabContentProps) {
  return (
    <div className="space-y-4">
      {/* Calendar Info Card */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-xl shadow-black/20">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ui-text-muted mb-4">
          Informasi Kalender
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-ui-text-muted mb-1">Judul</p>
            <p className="text-sm text-ui-text">{calendar.title}</p>
          </div>
          {calendar.description && (
            <div>
              <p className="text-xs font-medium text-ui-text-muted mb-1">Deskripsi</p>
              <p className="text-sm text-ui-text">{calendar.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-ui-text-muted mb-1">Visibilitas</p>
            <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-medium text-ui-text">
              {calendar.visibility}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-ui-text-muted mb-1">Status</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${calendar.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-white/50 border-white/10"}`}>
              {calendar.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-xl shadow-black/20">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ui-text-muted mb-4">
          Statistik
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-ui-text-muted mb-1">Total Event</p>
            <p className="text-3xl font-bold text-ui-text">{calendar.eventCount}</p>
          </div>
          <div>
            <p className="text-xs text-ui-text-muted mb-1">Dibuat</p>
            <p className="text-sm text-ui-text">
              {new Date(calendar.created_at).toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
        <h3 className="text-sm font-semibold text-rose-400 mb-1">Zona Berbahaya</h3>
        <p className="text-xs text-ui-text-muted mb-4">Tindakan di bawah ini tidak dapat diubah.</p>
        <button className="inline-flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-sm font-medium text-white transition-colors">
          <Trash2 className="h-4 w-4" />
          Hapus Kalender
        </button>
      </div>
    </div>
  );
}

function VisibilityTab({ calendar }: TabContentProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-xl shadow-black/20">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-ui-text-muted mb-4">
        Atur Visibilitas Kalender
      </h3>
      <p className="text-sm text-ui-text-2 mb-4">
        Pilih siapa yang dapat melihat kalender ini dan event-eventnya.
      </p>
      <div className="space-y-2">
        {[
          { value: "private", label: "Pribadi", description: "Hanya Anda" },
          { value: "management-only", label: "Manajemen", description: "Owner, Manager, Coach" },
          { value: "team-only", label: "Tim", description: "Semua anggota tim" },
          { value: "public-workspace", label: "Publik", description: "Semua di organisasi" },
        ].map((option) => (
          <label
            key={option.value}
            className="flex items-center p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
          >
            <input
              type="radio"
              name="visibility"
              value={option.value}
              defaultChecked={calendar.visibility === option.value}
              className="h-4 w-4 accent-yellow-400"
            />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-ui-text">{option.label}</p>
              <p className="text-xs text-ui-text-muted">{option.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function MembersTab({ }: TabContentProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-xl shadow-black/20">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-ui-text-muted mb-4">
        Izin Anggota
      </h3>
      <p className="text-sm text-ui-text-2 mb-4">
        Kelola siapa yang dapat mengakses dan mengelola kalender ini.
      </p>
      <div className="text-center py-8 text-ui-text-muted text-sm">
        Member permissions feature akan segera hadir
      </div>
    </div>
  );
}

function AuditTab({ }: TabContentProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-xl shadow-black/20">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-ui-text-muted mb-4">
        Riwayat Audit
      </h3>
      <p className="text-sm text-ui-text-2 mb-4">
        Lihat semua perubahan yang dilakukan pada kalender ini.
      </p>
      <div className="text-center py-8 text-ui-text-muted text-sm">
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

  if (!permLoading && !canManageCalendars) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
        <div className="flex justify-start">
          <Link
            href={`/${teamSlug}/calendar`}
            className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Kembali ke kalender
          </Link>
        </div>
        <div className="mx-auto max-w-2xl w-full text-center py-16">
          <h1 className="text-xl font-bold text-ui-text mb-2">Akses Ditolak</h1>
          <p className="text-sm text-ui-text-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  const manageableCalendars = calendars.filter((cal) => cal.canManage);
  const selectedCalendar = manageableCalendars[0];

  if (isLoading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-8">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 text-sm text-rose-400">
          Gagal memuat kalender: {error.message}
        </div>
      </div>
    );
  }

  if (manageableCalendars.length === 0) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
        <div className="flex justify-start">
          <Link
            href={`/${teamSlug}/calendar`}
            className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Kembali ke kalender
          </Link>
        </div>
        <div className="mx-auto max-w-2xl w-full text-center py-16 space-y-4">
          <h1 className="text-xl font-bold text-ui-text">Tidak Ada Kalender</h1>
          <p className="text-sm text-ui-text-2">Anda belum membuat atau mengelola kalender apapun.</p>
          <Link
            href={`/${teamSlug}/calendar/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 px-4 py-2 text-sm font-semibold text-black transition-colors"
          >
            Buat Kalender
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      {/* Tombol Kembali */}
      <div className="flex justify-start">
        <Link
          href={`/${teamSlug}/calendar`}
          className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke kalender
        </Link>
      </div>

      {/* Konten Terpusat */}
      <div className="mx-auto max-w-2xl w-full space-y-6">
        <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight">
          Pengaturan Kalender
        </h1>

        {/* Calendar selector (if multiple) */}
        {manageableCalendars.length > 1 && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 shadow-xl shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-muted mb-3">Kalender Saya</p>
            <div className="space-y-1">
              {manageableCalendars.map((cal) => (
                <button
                  key={cal.id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCalendar?.id === cal.id
                      ? "bg-yellow-400/10 text-yellow-400"
                      : "text-ui-text-2 hover:bg-white/5 hover:text-ui-text"
                  }`}
                >
                  <p className="font-medium">{cal.title}</p>
                  <p className="text-xs text-ui-text-muted mt-0.5">{cal.eventCount} event</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-yellow-400 border-yellow-400"
                    : "text-ui-text-muted border-transparent hover:text-ui-text"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {selectedCalendar ? (
          <>
            {activeTab === "overview" && <OverviewTab calendar={selectedCalendar} teamSlug={teamSlug} />}
            {activeTab === "visibility" && <VisibilityTab calendar={selectedCalendar} teamSlug={teamSlug} />}
            {activeTab === "members" && <MembersTab calendar={selectedCalendar} teamSlug={teamSlug} />}
            {activeTab === "audit" && <AuditTab calendar={selectedCalendar} teamSlug={teamSlug} />}
          </>
        ) : (
          <div className="text-center py-8 text-ui-text-muted text-sm">
            Pilih kalender untuk melihat pengaturannya
          </div>
        )}
      </div>
    </div>
  );
}
