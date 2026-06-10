"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useNotify } from "./NotifyModal";

const EXPORTS = [
  { key: "profiles", label: "Profil User", description: "Nama, username, WA, tanggal lahir" },
  { key: "members", label: "Anggota Tim", description: "Member, tim, divisi, role" },
  { key: "scrims", label: "Semua Scrim", description: "Lawan, jadwal, format, status" },
  { key: "results", label: "Hasil Scrim", description: "Score, W/L, catatan" },
  { key: "announcements", label: "Pengumuman", description: "Judul, isi, tanggal" },
  { key: "finances", label: "Keuangan", description: "Pemasukan & pengeluaran" },
  { key: "salaries", label: "Kontrak Salary", description: "Kontrak player & gaji bulanan" },
  { key: "sponsors", label: "Sponsor", description: "Daftar sponsor & nilai deal" },
] as const;

const ExportButtons = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { success, error: notifyError } = useNotify();

  async function handleExport(key: string) {
    setLoading(key);
    try {
      const supabase = createClient();
      let csv = "";

      if (key === "profiles") {
        const { data } = await supabase.from("profiles").select("full_name, username, display_name, phone_wa, date_of_birth, created_at");
        if (!data || data.length === 0) { notifyError("Tidak ada data"); setLoading(null); return; }
        csv = toCsv(data, ["Nama Lengkap", "Username", "Display Name", "WhatsApp", "Tanggal Lahir", "Terdaftar"]);
      } else if (key === "members") {
        const { data } = await supabase.from("team_members").select("user_id, organization_id, division_id, role, is_active, joined_at");
        if (!data || data.length === 0) { notifyError("Tidak ada data"); setLoading(null); return; }
        csv = toCsv(data, ["User ID", "Organization ID", "Division ID", "Role", "Aktif", "Bergabung"]);
      } else if (key === "scrims") {
        const { data } = await supabase.from("scrims").select("opponent_name, scheduled_at, format, status, notes, created_at");
        if (!data || data.length === 0) { notifyError("Tidak ada data"); setLoading(null); return; }
        csv = toCsv(data, ["Lawan", "Jadwal", "Format", "Status", "Catatan", "Dibuat"]);
      } else if (key === "results") {
        const { data } = await supabase.from("scrim_results").select("our_score, opponent_score, is_win, notes, performance_rating, recorded_at");
        if (!data || data.length === 0) { notifyError("Tidak ada data"); setLoading(null); return; }
        csv = toCsv(data, ["Skor Kita", "Skor Lawan", "Menang", "Catatan", "Rating", "Dicatat"]);
      } else if (key === "announcements") {
        const { data } = await supabase.from("announcements").select("title, body, is_pinned, created_at");
        if (!data || data.length === 0) { notifyError("Tidak ada data"); setLoading(null); return; }
        csv = toCsv(data, ["Judul", "Isi", "Pinned", "Dibuat"]);
      } else if (key === "finances") {
        const { data } = await supabase.from("finances").select("type, amount, category, description, date, created_at");
        if (!data || data.length === 0) { notifyError("Tidak ada data"); setLoading(null); return; }
        csv = toCsv(data, ["Tipe", "Jumlah", "Kategori", "Deskripsi", "Tanggal", "Dibuat"]);
      } else if (key === "salaries") {
        const { data } = await supabase.from("player_contracts").select("user_id, monthly_salary, bonus_percentage, status, start_date, end_date, notes");
        if (!data || data.length === 0) { notifyError("Tidak ada data"); setLoading(null); return; }
        csv = toCsv(data, ["Player ID", "Gaji Bulanan", "Bonus %", "Status", "Mulai", "Berakhir", "Catatan"]);
      } else if (key === "sponsors") {
        const { data } = await supabase.from("sponsors").select("name, status, deal_value, currency, start_date, end_date, notes");
        if (!data || data.length === 0) { notifyError("Tidak ada data"); setLoading(null); return; }
        csv = toCsv(data, ["Nama", "Status", "Nilai Deal", "Mata Uang", "Mulai", "Berakhir", "Catatan"]);
      }

      if (!csv) { notifyError("Gagal export"); setLoading(null); return; }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      success(`${EXPORTS.find((e) => e.key === key)?.label} berhasil di-export`);
    } catch {
      notifyError("Gagal export data");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {EXPORTS.map((exp) => (
        <button
          key={exp.key}
          type="button"
          disabled={loading !== null}
          onClick={() => handleExport(exp.key)}
          className="flex items-center gap-3 rounded-lg border border-ui-border bg-ui-surface p-4 text-left transition hover:bg-ui-hover disabled:opacity-50"
        >
          {loading === exp.key ? (
            <Loader2 className="h-5 w-5 animate-spin text-ui-text-2" />
          ) : (
            <Download className="h-5 w-5 text-ui-text-2" />
          )}
          <div>
            <p className="text-sm font-medium text-ui-text-dim">{exp.label}</p>
            <p className="text-xs text-ui-text-muted">{exp.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
};
export { ExportButtons };

function toCsv(data: Record<string, unknown>[], headers: string[]): string {
  const keys = Object.keys(data[0]!);
  const rows = data.map((row) =>
    keys.map((k) => {
      const val = row[k];
      if (val === null || val === undefined) return "";
      if (typeof val === "boolean") return val ? "Ya" : "Tidak";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}
