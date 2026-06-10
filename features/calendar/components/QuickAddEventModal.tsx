"use client";

import { X, Loader2, Calendar, Clock, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { createCalendarEventAction } from "../actions";

interface QuickAddEventModalProps {
  isOpen: boolean;
  date: Date | null;
  orgSlug: string;
  divisions?: Array<{ id: string; name: string }>;
  userRole?: string;
  onClose: () => void;
}

const EVENT_TYPES = [
  { value: "practice", label: "Latihan", color: "text-green-400" },
  { value: "meeting", label: "Meeting", color: "text-purple-400" },
  { value: "other", label: "Lainnya", color: "text-white/60" },
] as const;

function toLocalDatetimeValue(date: Date): string {
  // Format: YYYY-MM-DDTHH:mm (local)
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

const QuickAddEventModal = ({
  isOpen,
  date,
  orgSlug,
  divisions = [],
  userRole = "member",
  onClose,
}: QuickAddEventModalProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string>("practice");
  const [startsAt, setStartsAt] = useState<string>("");
  const titleRef = useRef<HTMLInputElement>(null);

  const visibilityOptions = [
    { value: "all", label: "Semua Tim" },
    ...(userRole === "owner" ? [
      { value: "management", label: "Manajemen (Owner + Manager)" },
      { value: "private", label: "Hanya Saya (Private)" }
    ] : []),
    ...(userRole === "manager" ? [
      { value: "coach_up", label: "Coach & Saya" },
      { value: "private", label: "Hanya Saya (Private)" }
    ] : []),
    ...(userRole === "coach" || userRole === "captain" ? [
      { value: "private", label: "Hanya Saya (Private)" }
    ] : [])
  ];

  // Default starts_at = clicked date at 08:00
  const defaultStartsAt = date
    ? (() => {
        const d = new Date(date);
        d.setHours(8, 0, 0, 0);
        return toLocalDatetimeValue(d);
      })()
    : "";

  // Default ends_at = clicked date at 09:00
  const defaultEndsAt = date
    ? (() => {
        const d = new Date(date);
        d.setHours(9, 0, 0, 0);
        return toLocalDatetimeValue(d);
      })()
    : "";

  // Auto-focus title on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setEventType("practice");
      setStartsAt(defaultStartsAt);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen || !date) return null;

  const dateLabel = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);

    // Client-side guard: ends_at tidak boleh sebelum starts_at
    const startsAtVal = fd.get("starts_at") as string;
    const endsAtVal = fd.get("ends_at") as string;
    if (endsAtVal && startsAtVal && new Date(endsAtVal) < new Date(startsAtVal)) {
      setError("Waktu selesai tidak boleh sebelum waktu mulai.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await createCalendarEventAction(orgSlug, {
        title: fd.get("title"),
        description: fd.get("description") || null,
        event_type: fd.get("event_type"),
        division_id: fd.get("division_id") || null,
        starts_at: startsAtVal,
        ends_at: endsAtVal || null,
        is_all_day: fd.get("is_all_day") === "on",
        location: null,
        visibility: fd.get("visibility") || "all",
      });

      if (!res.ok) {
        setError(res.message);
        return;
      }

      onClose();
      router.refresh();
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tambah event"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-ui-bg shadow-[0_0_50px_-12px_rgba(234,179,8,0.15)] transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-yellow-400">Tambah event</p>
              <p className="text-sm font-bold text-ui-text tracking-tight">{dateLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/5 hover:text-ui-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Tip Banner */}
          <div className="rounded-xl bg-zinc-900/60 p-3 text-[11px] leading-relaxed text-white/50 border border-white/5">
            <span className="font-semibold text-yellow-400">Tips Senior:</span> Turnamen resmi tim dibuat melalui menu <strong className="text-ui-text">Turnamen</strong> agar otomatis sinkron dengan sistem kehadiran dan rekapitulasi data.
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-white/40">
              Nama Event
            </label>
            <input
              ref={titleRef}
              name="title"
              required
              maxLength={200}
              placeholder="Masukkan nama event..."
              className="w-full rounded-lg border border-white/10 bg-zinc-900/40 px-3.5 py-2 text-xs text-white placeholder:text-white/20 transition-all duration-300 focus:border-yellow-400/50 focus:outline-none"
            />
          </div>

          {/* Event type */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold text-white/40">
              Kategori Event
            </label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEventType(t.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-300 ${
                    eventType === t.value
                      ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 scale-105"
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-ui-text hover:scale-102"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Hidden input for event_type */}
            <input type="hidden" name="event_type" value={eventType} />
          </div>

          {/* Time fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/40">
                <Clock className="h-3 w-3 text-white/30" /> Waktu Mulai
              </label>
              <input
                type="datetime-local"
                name="starts_at"
                defaultValue={defaultStartsAt}
                required
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs text-white transition-all duration-300 focus:border-yellow-400/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/40">
                <Clock className="h-3 w-3 text-white/30" /> Waktu Selesai (Opsional)
              </label>
              <input
                type="datetime-local"
                name="ends_at"
                defaultValue={defaultEndsAt}
                min={startsAt || undefined}
                className="w-full rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-xs text-white transition-all duration-300 focus:border-yellow-400/50 focus:outline-none"
              />
            </div>
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between rounded-xl bg-zinc-900/40 border border-white/5 px-4 py-3">
            <div className="space-y-0.5">
              <span className="block text-xs font-semibold text-white/80">Event Seharian</span>
              <span className="block text-[10px] text-white/40">Setel event berlangsung sepanjang hari</span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="is_all_day"
                className="peer sr-only"
              />
              <div className="peer h-5 w-9 rounded-full bg-zinc-800 transition-all duration-300 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/60 after:transition-all after:content-[''] peer-checked:bg-yellow-400 peer-checked:after:translate-x-full peer-checked:after:bg-black peer-hover:bg-zinc-700/80"></div>
            </label>
          </div>

          {/* Division (if multiple exist) */}
          {divisions.length > 0 && (
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-white/40">
                Pilih Divisi
              </label>
              <select
                name="division_id"
                defaultValue=""
                className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs text-white transition-all duration-300 focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 focus:outline-none cursor-pointer"
              >
                <option value="">Semua divisi</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visibility selection */}
          {visibilityOptions.length > 1 && (
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-white/40">
                Siapa yang bisa melihat event ini?
              </label>
              <select
                name="visibility"
                defaultValue="all"
                className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs text-white transition-all duration-300 focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 focus:outline-none cursor-pointer"
              >
                {visibilityOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-white/40">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              name="description"
              rows={2}
              maxLength={2000}
              placeholder="Tambahkan detail, link, atau catatan penting..."
              className="w-full resize-none rounded-lg border border-white/10 bg-zinc-900/40 px-3.5 py-2.5 text-xs text-white/80 placeholder:text-white/20 transition-all duration-300 focus:border-yellow-400/50 focus:outline-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white/60 transition-all duration-300 hover:bg-white/5 hover:text-ui-text active:scale-95"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-yellow-400 px-5 text-sm font-bold text-black shadow-lg shadow-yellow-400/10 transition-all duration-300 hover:bg-yellow-300 hover:shadow-yellow-400/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Buat event
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
export { QuickAddEventModal };
