"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { exportAuditLogs } from "@/features/dashboard/actions/exportAuditLogs";

interface AuditExportButtonProps {
  filters: {
    search: string;
    module: string;
    actor: string;
    from: string;
    to: string;
  };
}

function rowsToCsv(rows: { timestamp: string; actor: string; action: string; actionLabel: string; entityType: string; entityId: string; metadata: string }[]): string {
  const headers = ["Waktu", "Aktor", "Aksi", "Label", "Modul", "Entity ID", "Metadata"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.timestamp, r.actor, r.action, r.actionLabel, r.entityType, r.entityId, r.metadata]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  return lines.join("\n");
}

const AuditExportButton = ({ filters }: AuditExportButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { rows } = await exportAuditLogs({
        search: filters.search || undefined,
        entityType: filters.module || undefined,
        actorId: filters.actor || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });

      const csv = rowsToCsv(rows);
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `audit-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-ui-border bg-ui-surface text-xs text-ui-text-2 hover:text-ui-text disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      Export CSV
    </button>
  );
};
export { AuditExportButton };
