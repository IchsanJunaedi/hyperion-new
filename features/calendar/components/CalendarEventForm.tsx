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
  { value: "scrim", label: "Scrim" },
  { value: "tournament", label: "Turnamen" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Lainnya" },
] as const;

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
      <Field label="Judul event" name="title" errors={fieldErrors["title"]}>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="mis. Latihan rutin Senin"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Tipe event" name="event_type" errors={fieldErrors["event_type"]}>
        <select
          name="event_type"
          required
          defaultValue="practice"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Waktu mulai" name="starts_at" errors={fieldErrors["starts_at"]}>
        <input
          type="datetime-local"
          name="starts_at"
          required
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Waktu selesai (opsional)" name="ends_at" errors={fieldErrors["ends_at"]}>
        <input
          type="datetime-local"
          name="ends_at"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Divisi (opsional)" name="division_id" errors={fieldErrors["division_id"]}>
        <select
          name="division_id"
          defaultValue=""
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        >
          <option value="">Semua divisi</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Lokasi (opsional)" name="location" errors={fieldErrors["location"]}>
        <input
          name="location"
          maxLength={200}
          placeholder="mis. Discord server, Bootcamp"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Deskripsi (opsional)" name="description" errors={fieldErrors["description"]}>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="Detail tambahan tentang event..."
          className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
        <input
          type="checkbox"
          name="is_all_day"
          className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-yellow-400 focus:ring-yellow-400"
        />
        Event seharian
      </label>

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
