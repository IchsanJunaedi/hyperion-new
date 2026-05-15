"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

const EXPORTS = [
  { key: "members", label: "Anggota Tim", table: "team_members", select: "user_id, organization_id, division_id, role, is_active, joined_at" },
  { key: "scrims", label: "Semua Scrim", table: "scrims", select: "id, organization_id, division_id, opponent_name, scheduled_at, format, status, created_at" },
  { key: "results", label: "Hasil Scrim", table: "scrim_results", select: "id, scrim_id, our_score, opponent_score, is_win, recorded_at" },
  { key: "announcements", label: "Pengumuman", table: "announcements", select: "id, organization_id, title, body, is_pinned, created_at" },
  { key: "profiles", label: "Profil User", table: "profiles", select: "id, full_name, username, display_name, phone_wa, date_of_birth, created_at" },
] as const;

export function ExportButtons() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleExport(key: string, table: string, select: string, label: string) {
    setLoading(key);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from(table as "profiles").select(select);

      if (error) {
        toast.error(`Gagal export: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Tidak ada data untuk di-export");
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0] as Record<string, unknown>);
      const rows = (data as Record<string, unknown>[]).map((row) =>
        headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(","),
      );
      const csv = [headers.join(","), ...rows].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${label} berhasil di-export`);
    } catch {
      toast.error("Gagal export data");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {EXPORTS.map((exp) => (
        <button
          key={exp.key}
          type="button"
          disabled={loading !== null}
          onClick={() => handleExport(exp.key, exp.table, exp.select, exp.label)}
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-900/40 p-4 text-left transition hover:border-white/20 hover:bg-zinc-900/60 disabled:opacity-50"
        >
          {loading === exp.key ? (
            <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
          ) : (
            <Download className="h-5 w-5 text-yellow-400" />
          )}
          <div>
            <p className="text-sm font-medium text-white">{exp.label}</p>
            <p className="text-xs text-white/40">Download CSV</p>
          </div>
        </button>
      ))}
    </div>
  );
}
