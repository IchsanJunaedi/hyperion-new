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
  onClose: () => void;
}

const EVENT_TYPES = [
  { value: "practice", label: "Latihan", color: "text-green-400" },
  { value: "scrim", label: "Scrim", color: "text-blue-400" },
  { value: "tournament", label: "Turnamen", color: "text-yellow-400" },
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

export function QuickAddEventModal({
  isOpen,
  date,
  orgSlug,
  divisions = [],
  onClose,
}: QuickAddEventModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string>("practice");
  const titleRef = useRef<HTMLInputElement>(null);

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

    startTransition(async () => {
      setError(null);
      const res = await createCalendarEventAction(orgSlug, {
        title: fd.get("title"),
        description: fd.get("description") || null,
        event_type: fd.get("event_type"),
        division_id: fd.get("division_id") || null,
        starts_at: fd.get("starts_at"),
        ends_at: fd.get("ends_at") || null,
        is_all_day: fd.get("is_all_day") === "on",
        location: null,
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
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tambah event"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-[#202020] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-yellow-400" />
            <div>
              <p className="text-xs text-white/50">Tambah event</p>
              <p className="text-sm font-semibold text-white">{dateLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-white/40 transition hover:bg-white/8 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Title */}
          <input
            ref={titleRef}
            name="title"
            required
            maxLength={200}
            placeholder="Nama event..."
            className="w-full border-0 border-b border-white/10 bg-transparent pb-2 text-base font-medium text-white placeholder:text-white/30 focus:border-yellow-400/50 focus:outline-none"
          />

          {/* Event type */}
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 shrink-0 text-white/40" />
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEventType(t.value)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    eventType === t.value
                      ? "bg-white/15 text-white ring-1 ring-white/20"
                      : "text-white/50 hover:bg-white/8 hover:text-white/80"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Hidden input for event_type */}
            <input type="hidden" name="event_type" value={eventType} />
          </div>

          {/* Time row */}
          <div className="flex items-center gap-3">
            <Clock className="h-3.5 w-3.5 shrink-0 text-white/40" />
            <div className="flex flex-1 items-center gap-2">
              <input
                type="datetime-local"
                name="starts_at"
                defaultValue={defaultStartsAt}
                required
                className="flex-1 rounded-md border border-white/10 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-white focus:border-yellow-400/50 focus:outline-none"
              />
              <span className="text-xs text-white/30">→</span>
              <input
                type="datetime-local"
                name="ends_at"
                defaultValue={defaultEndsAt}
                className="flex-1 rounded-md border border-white/10 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-white focus:border-yellow-400/50 focus:outline-none"
              />
            </div>
          </div>

          {/* All day toggle */}
          <label className="flex cursor-pointer items-center gap-2 pl-5 text-xs text-white/50 hover:text-white/80">
            <input
              type="checkbox"
              name="is_all_day"
              className="h-3.5 w-3.5 rounded border-white/20 bg-zinc-900 accent-yellow-400"
            />
            Event seharian
          </label>

          {/* Division (if multiple exist) */}
          {divisions.length > 0 && (
            <div className="pl-5">
              <select
                name="division_id"
                defaultValue=""
                className="w-full rounded-md border border-white/10 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-white focus:border-yellow-400/50 focus:outline-none"
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

          {/* Description */}
          <textarea
            name="description"
            rows={2}
            maxLength={2000}
            placeholder="Catatan tambahan (opsional)..."
            className="w-full resize-none rounded-md border border-white/10 bg-zinc-900/40 px-3 py-2 text-xs text-white/80 placeholder:text-white/25 focus:border-yellow-400/50 focus:outline-none"
          />

          {/* Error */}
          {error && (
            <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-white/8 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-white/60 transition hover:bg-white/8 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Buat event
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
