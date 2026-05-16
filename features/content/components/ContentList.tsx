"use client";

import { Instagram, Plus, Twitter, Video } from "lucide-react";
import { useState } from "react";

import { ContentStatusBadge } from "./ContentStatusBadge";
import { ContentActionButtons } from "./ContentApproveButton";
import { ContentForm } from "./ContentForm";
import type { ContentCalendarRow } from "@/features/content/queries";
import type { ContentStatus } from "@/types/database";
import { PLATFORM_LABELS } from "@/lib/validations/content";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  ig: <Instagram className="h-4 w-4" />,
  tiktok: <Video className="h-4 w-4" />,
  x: <Twitter className="h-4 w-4" />,
};

const STATUS_FILTERS: Array<{ value: ContentStatus | "all"; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Menunggu Approve" },
  { value: "approved", label: "Disetujui" },
  { value: "published", label: "Published" },
];

interface ContentListProps {
  rows: (ContentCalendarRow & { creator_name: string | null })[];
  orgId: string;
  currentUserId: string;
  isOwner: boolean;
  canCreate: boolean;
}

export function ContentList({ rows, orgId, currentUserId, isOwner, canCreate }: ContentListProps) {
  const [filter, setFilter] = useState<ContentStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E5E2E1]">Konten</h1>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white"
          >
            <Plus className="h-4 w-4" /> Buat Konten
          </button>
        )}
      </div>

      <nav className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`h-8 rounded-full px-3 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-[#E5E2E1] text-[#191919]"
                : "bg-[#202020] text-[#9B9A97] hover:bg-[#2C2C2C]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-[#2D2D2D] p-10 text-center">
          <p className="text-sm text-[#9B9A97]">Belum ada konten.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-[#2D2D2D] bg-[#202020] p-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="mt-0.5 text-[#9B9A97]">
                  {PLATFORM_ICONS[item.platform]}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#9B9A97]">{PLATFORM_LABELS[item.platform]}</span>
                    <span className="text-xs text-[#6B6A68]">·</span>
                    <span className="text-xs text-[#9B9A97]">
                      {new Date(item.scheduled_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-[#E5E2E1] truncate">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-[#9B9A97] line-clamp-2">{item.description}</p>
                  )}
                  {item.creator_name && (
                    <p className="mt-1 text-xs text-[#6B6A68]">oleh {item.creator_name}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-none">
                <ContentStatusBadge status={item.status} />
                <ContentActionButtons
                  contentId={item.id}
                  orgId={orgId}
                  currentStatus={item.status}
                  isOwner={isOwner}
                  isCreatedByMe={item.created_by === currentUserId}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <ContentForm orgId={orgId} onClose={() => setShowForm(false)} />}
    </>
  );
}
