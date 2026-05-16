"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { updateNotifPrefsAction } from "@/features/settings/actions/updateNotifPrefs";

const EVENT_TYPES = [
  {
    key: "scrim_reminder",
    label: "Pengingat Scrim",
    desc: "Notifikasi WA sebelum scrim dimulai",
  },
  {
    key: "announcement",
    label: "Pengumuman Baru",
    desc: "Notifikasi saat ada pengumuman tim",
  },
  {
    key: "poll",
    label: "Polling Baru",
    desc: "Notifikasi saat ada polling yang perlu dijawab",
  },
  {
    key: "calendar_event",
    label: "Event Kalender",
    desc: "Notifikasi event kalender yang akan datang",
  },
  {
    key: "match_result",
    label: "Hasil Match",
    desc: "Notifikasi hasil scrim atau pertandingan",
  },
];

export function NotifSection({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(EVENT_TYPES.map((e) => [e.key, true])),
  );

  useEffect(() => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("notification_preferences")
      .select("event_type,wa_enabled")
      .eq("org_id", orgId)
      .then(
        ({
          data,
        }: {
          data: Array<{ event_type: string; wa_enabled: boolean }> | null;
        }) => {
          if (data && data.length > 0) {
            const map: Record<string, boolean> = {};
            data.forEach((r) => {
              map[r.event_type] = r.wa_enabled;
            });
            setPrefs((prev) => ({ ...prev, ...map }));
          }
          setLoading(false);
        },
      );
  }, [orgId]);

  async function handleSave() {
    setSaving(true);
    const result = await updateNotifPrefsAction(
      orgId,
      EVENT_TYPES.map((e) => ({ event_type: e.key, wa_enabled: prefs[e.key] ?? true })),
    );
    setSaving(false);
    if (result.ok) toast.success("Preferensi notifikasi disimpan.");
    else toast.error(result.message);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B6A68]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#9B9A97]">
        Atur notifikasi WhatsApp yang kamu terima dari tim.
      </p>

      <div className="space-y-3">
        {EVENT_TYPES.map((ev) => (
          <div
            key={ev.key}
            className="flex items-center justify-between rounded border border-[#2D2D2D] px-4 py-3"
          >
            <div>
              <p className="text-sm text-[#D4D4D4]">{ev.label}</p>
              <p className="text-xs text-[#6B6A68]">{ev.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[ev.key]}
              onClick={() =>
                setPrefs((p) => ({ ...p, [ev.key]: !p[ev.key] }))
              }
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                prefs[ev.key] ? "bg-green-600" : "bg-[#353434]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  prefs[ev.key] ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded bg-[#2C2C2C] px-4 py-2 text-sm text-[#D4D4D4] transition hover:bg-[#353434] cursor-pointer disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan Preferensi
      </button>
    </div>
  );
}
