"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import type { AuditLogItem } from "@/features/dashboard/actions/fetchAuditLogs";

export type { AuditLogItem };

function getActionColor(action: string): string {
  if (
    action.endsWith(".delete") ||
    ["member_removed", "member_kicked", "division_deleted", "org_deleted"].includes(action)
  ) return "text-red-400";
  if (
    action.endsWith(".create") ||
    action.endsWith(".upload") ||
    ["member_joined", "user_registered", "team_created", "division_created"].includes(action)
  ) return "text-green-400";
  if (action.endsWith(".update") || action.endsWith(".status_change") || action === "org_updated")
    return "text-blue-400";
  if (action.includes("archived")) return "text-amber-400";
  if (action === "role_changed") return "text-purple-400";
  if (action.includes("accepted")) return "text-green-400";
  if (action.includes("declined")) return "text-red-400";
  return "text-white/60";
}

function formatMetadata(action: string, meta: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return "";

  if (
    action.endsWith(".create") ||
    action.endsWith(".upload") ||
    ["team_created", "division_created", "user_registered", "member_joined"].includes(action)
  ) {
    const label = meta.title ?? meta.name ?? meta.email ?? meta.displayName;
    if (label) return String(label);
  }

  if (
    action.endsWith(".delete") ||
    ["member_removed", "member_kicked", "division_deleted", "org_deleted"].includes(action)
  ) {
    const label = meta.title ?? meta.name ?? meta.target_name;
    if (label) return `Dihapus: ${label}`;
  }

  if (action.endsWith(".update") || action === "org_updated") {
    const changes = meta.changes as Record<string, [unknown, unknown]> | undefined;
    if (changes) {
      return Object.entries(changes)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? `${v[0]} → ${v[1]}` : v}`)
        .join(", ");
    }
    const name = meta.newName ?? meta.name;
    if (name) return String(name);
  }

  if (action.endsWith(".status_change") || action.includes("status")) {
    if (meta.from && meta.to) return `${meta.from} → ${meta.to}`;
  }

  if (action === "role_changed") {
    if (meta.from && meta.to) return `${meta.from} → ${meta.to}`;
  }

  return Object.entries(meta)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

interface AuditLogListProps {
  logs: AuditLogItem[];
  showSearch?: boolean;
}

export function AuditLogList({ logs, showSearch = false }: AuditLogListProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? logs.filter((log) => {
        const q = query.toLowerCase();
        return (
          log.actionLabel.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          JSON.stringify(log.metadata).toLowerCase().includes(q)
        );
      })
    : logs;

  // Group by date
  const groups = new Map<string, AuditLogItem[]>();
  for (const log of filtered) {
    const day = new Date(log.rawTime).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(log);
  }

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6A68] pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aksi, aktor..."
            className="pl-8 h-8 text-sm bg-[#202020] border-[#2D2D2D] text-[#E5E2E1] placeholder:text-[#6B6A68] focus-visible:ring-0 focus-visible:border-[#9B9A97]"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">
          {query ? "Tidak ada hasil yang cocok." : "Belum ada aktivitas tercatat."}
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([day, dayLogs]) => (
            <div key={day}>
              <div className="mb-2 text-xs font-medium text-[#6B6A68] uppercase tracking-wider">
                {day}
              </div>
              <div className="space-y-1">
                {dayLogs.map((log) => {
                  const color = getActionColor(log.action);
                  const metaDisplay = formatMetadata(log.action, log.metadata);
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium ${color}`}>
                            {log.actionLabel}
                          </span>
                          <span className="text-xs text-white/30">oleh</span>
                          <span className="text-xs font-medium text-white/70">
                            {log.actorName}
                          </span>
                        </div>
                        {metaDisplay && (
                          <p className="mt-0.5 text-xs text-white/40 truncate">
                            {metaDisplay}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-white/30">{log.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
