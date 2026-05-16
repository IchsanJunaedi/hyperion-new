"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const ACTION_COLORS: Record<string, string> = {
  org_updated: "text-blue-400",
  division_archived: "text-amber-400",
  division_deleted: "text-red-400",
  member_removed: "text-red-400",
  role_changed: "text-purple-400",
  member_added: "text-green-400",
  scrim_created: "text-blue-400",
  announcement_created: "text-blue-400",
};

export type AuditLogItem = {
  id: string;
  action: string;
  actionLabel: string;
  actorName: string;
  metaText: string;
  time: string;
};

interface AuditLogListProps {
  logs: AuditLogItem[];
}

export function AuditLogList({ logs }: AuditLogListProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? logs.filter((log) => {
        const q = query.toLowerCase();
        return (
          log.actionLabel.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          log.metaText.toLowerCase().includes(q)
        );
      })
    : logs;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-white/60">
            Riwayat semua aktivitas penting: perubahan role, update tim, hapus divisi, dll.
          </p>
        </div>
        <div className="relative shrink-0 w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6A68] pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aksi, aktor..."
            className="pl-8 h-8 text-sm bg-[#202020] border-[#2D2D2D] text-[#E5E2E1] placeholder:text-[#6B6A68] focus-visible:ring-0 focus-visible:border-[#9B9A97]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">
          {query ? "Tidak ada hasil yang cocok." : "Belum ada aktivitas tercatat."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => {
            const actionColor = ACTION_COLORS[log.action] ?? "text-white/60";
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${actionColor}`}>
                      {log.actionLabel}
                    </span>
                    <span className="text-xs text-white/30">oleh</span>
                    <span className="text-xs font-medium text-white/70">{log.actorName}</span>
                  </div>
                  {log.metaText && (
                    <p className="mt-0.5 text-xs text-white/40 truncate">{log.metaText}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-white/30">{log.time}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
