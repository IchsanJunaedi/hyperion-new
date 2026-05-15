"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { createScrimAction } from "@/features/scrim/actions";
import type { MatchFormat } from "@/types/database";
import { useRouter } from "next/navigation";

interface ScrimFormProps {
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
}

const FORMATS: Array<{ value: MatchFormat; label: string }> = [
  { value: "bo1", label: "BO1" },
  { value: "bo3", label: "BO3" },
  { value: "bo5", label: "BO5" },
];

const ROOM_TYPES = [
  { value: "custom_room", label: "Custom Room" },
  { value: "tournament", label: "Tournament" },
] as const;

export function ScrimForm({ orgSlug, divisions }: ScrimFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
    {},
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setGlobalError(null);
          setFieldErrors({});
          const res = await createScrimAction(orgSlug, {
            division_id: fd.get("division_id"),
            opponent_name: fd.get("opponent_name"),
            opponent_contact: fd.get("opponent_contact"),
            scheduled_at: fd.get("scheduled_at"),
            format: fd.get("format"),
            server_region: fd.get("server_region"),
            room_info: fd.get("room_info"),
            notes: fd.get("notes"),
          });
          if (!res.ok) {
            setGlobalError(res.message);
            setFieldErrors(res.fieldErrors ?? {});
            return;
          }
          router.push(`/${orgSlug}/scrim/${res.scrim.id}`);
        });
      }}
      className="space-y-4"
    >
      <Field label="Divisi" name="division_id" errors={fieldErrors["division_id"]}>
        {divisions.length === 1 ? (
          <>
            <input type="hidden" name="division_id" value={divisions[0]!.id} />
            <p className="h-10 flex items-center rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white/70">
              {divisions[0]!.name}
            </p>
          </>
        ) : (
          <select
            name="division_id"
            required
            defaultValue=""
            className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
          >
            <option value="" disabled>
              Pilih divisi…
            </option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        label="Nama lawan"
        name="opponent_name"
        errors={fieldErrors["opponent_name"]}
      >
        <input
          name="opponent_name"
          required
          maxLength={120}
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Kontak lawan"
        name="opponent_contact"
        errors={fieldErrors["opponent_contact"]}
      >
        <input
          name="opponent_contact"
          required
          maxLength={120}
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Jadwal"
        name="scheduled_at"
        errors={fieldErrors["scheduled_at"]}
      >
        <input
          type="datetime-local"
          name="scheduled_at"
          required
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Format" name="format" errors={fieldErrors["format"]}>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f, i) => (
            <label
              key={f.value}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-800 px-3 py-2 text-sm text-white/85 has-[input:checked]:bg-yellow-400 has-[input:checked]:text-black"
            >
              <input
                type="radio"
                name="format"
                value={f.value}
                defaultChecked={i === 1}
                className="sr-only"
              />
              {f.label}
            </label>
          ))}
        </div>
      </Field>

      <Field
        label="Server / region"
        name="server_region"
        errors={fieldErrors["server_region"]}
      >
        <input
          name="server_region"
          required
          maxLength={60}
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Room info"
        name="room_info"
        errors={fieldErrors["room_info"]}
      >
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map((r, i) => (
            <label
              key={r.value}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-800 px-3 py-2 text-sm text-white/85 has-[input:checked]:bg-yellow-400 has-[input:checked]:text-black"
            >
              <input
                type="radio"
                name="room_info"
                value={r.value}
                defaultChecked={i === 0}
                className="sr-only"
              />
              {r.label}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Catatan (opsional)" name="notes" errors={fieldErrors["notes"]}>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

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
        Buat scrim
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
