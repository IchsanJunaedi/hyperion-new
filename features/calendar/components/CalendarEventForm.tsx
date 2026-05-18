"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createCalendarEventAction } from "../actions";

interface CalendarEventFormProps {
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
}

const EVENT_TYPES = [
  { value: "practice", label: "Latihan" },
  { value: "meeting", label: "Meeting" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "other", label: "Lainnya" },
] as const;

const inputCls =
  "h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none [color-scheme:dark]";

const selectCls =
  "h-10 w-full appearance-none rounded-md border border-white/10 bg-zinc-900 px-3 pr-9 text-sm text-white focus:border-yellow-400 focus:outline-none";

export function CalendarEventForm({ orgSlug, divisions }: CalendarEventFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setGlobalError(null);
          setFieldErrors({});
          const res = await createCalendarEventAction(orgSlug, {
            title: fd.get("title"),
            description: fd.get("description"),
            event_type: fd.get("event_type"),
            division_id: fd.get("division_id") || null,
            starts_at: fd.get("starts_at"),
            ends_at: fd.get("ends_at") || null,
            is_all_day: fd.get("is_all_day") === "on",
            location: fd.get("location"),
          });
          if (!res.ok) {
            setGlobalError(res.message);
            setFieldErrors(res.fieldErrors ?? {});
            return;
          }
          router.push(`/${orgSlug}/calendar`);
        });
      }}
      className="space-y-4"
    >
      {/* Tip Banner */}
      <div className="rounded-lg bg-zinc-950/60 p-4 text-xs leading-relaxed text-white/55 border border-white/5 mb-2">
        <span className="font-semibold text-yellow-400">Tips Senior:</span> Turnamen resmi tim dibuat melalui menu <strong className="text-white">Turnamen</strong> agar otomatis sinkron dengan sistem kehadiran dan rekapitulasi data.
      </div>

      <Field label="Judul event" name="title" errors={fieldErrors["title"]}>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          className={inputCls}
        />
      </Field>

      {/* Tipe event — custom select with proper arrow */}
      <Field label="Tipe event" name="event_type" errors={fieldErrors["event_type"]}>
        <div className="relative">
          <select
            id="event_type"
            name="event_type"
            required
            defaultValue="practice"
            className={selectCls}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </Field>

      <Field label="Waktu mulai" name="starts_at" errors={fieldErrors["starts_at"]}>
        <input
          id="starts_at"
          type="datetime-local"
          name="starts_at"
          required
          className={inputCls}
        />
      </Field>

      <Field label="Waktu selesai (opsional)" name="ends_at" errors={fieldErrors["ends_at"]}>
        <input
          id="ends_at"
          type="datetime-local"
          name="ends_at"
          className={inputCls}
        />
      </Field>

      {/* Divisi — custom select */}
      <Field label="Divisi (opsional)" name="division_id" errors={fieldErrors["division_id"]}>
        <div className="relative">
          <select
            id="division_id"
            name="division_id"
            defaultValue=""
            className={selectCls}
          >
            <option value="">Semua divisi</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </Field>

      <Field label="Lokasi (opsional)" name="location" errors={fieldErrors["location"]}>
        <input
          id="location"
          name="location"
          maxLength={200}
          className={inputCls}
        />
      </Field>

      <Field label="Deskripsi (opsional)" name="description" errors={fieldErrors["description"]}>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

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

      {globalError ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {globalError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-yellow-400 px-5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Buat event
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  errors,
  children,
}: {
  label: string;
  name: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-white/70">
        {label}
      </label>
      {children}
      {errors && errors.length > 0 ? (
        <p className="text-xs text-rose-400">{errors[0]}</p>
      ) : null}
    </div>
  );
}
