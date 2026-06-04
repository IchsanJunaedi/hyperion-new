"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { notify } from "@/features/dashboard/components/NotifyModal";

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

const NotifSection = ({ orgId }: { orgId: string }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(EVENT_TYPES.map((e) => [e.key, true])),
  );

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("notification_preferences")
      .select("event_type,wa_enabled")
      .eq("org_id", orgId)
      .then(({ data }: { data: Array<{ event_type: string; wa_enabled: boolean }> | null }) => {
        if (!mounted) return;
        if (data && data.length > 0) {
          const map: Record<string, boolean> = {};
          data.forEach((r) => { map[r.event_type] = r.wa_enabled; });
          setPrefs((prev) => ({ ...prev, ...map }));
        }
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [orgId]);

  async function handleSave() {
    setSaving(true);
    const result = await updateNotifPrefsAction(
      orgId,
      EVENT_TYPES.map((e) => ({ event_type: e.key, wa_enabled: prefs[e.key] ?? true })),
    );
    setSaving(false);
    if (result.ok) notify.success("Preferensi notifikasi disimpan.");
    else notify.error(result.message);
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
              className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 cursor-pointer outline-none border-none p-0 ${
                prefs[ev.key] ? "bg-[#238636]" : "bg-[#0D0D0D]"
              }`}
            >
              {/* Track Shadow Internal */}
              <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_4px_rgba(0,0,0,0.4)]" />
              
              <span
                className={`absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full transition-all duration-300 shadow-sm ${
                  prefs[ev.key]
                    ? "translate-x-[20px] bg-white"
                    : "translate-x-0 bg-[#3A3A3A]"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="group relative flex items-center justify-center gap-2 rounded-lg bg-[#E5E2E1] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Simpan Preferensi"
        )}
      </button>
    </div>
  );
};
export { NotifSection };
