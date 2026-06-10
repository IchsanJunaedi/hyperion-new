"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { updateScrimAction } from "@/features/scrim/actions";
import type { MatchFormat } from "@/types/database";
import { useRouter } from "next/navigation";

interface ScrimEditFormProps {
  orgSlug: string;
  scrimId: string;
  divisions: Array<{ id: string; name: string }>;
  initialValues: {
    division_id: string;
    opponent_name: string;
    opponent_contact: string | null;
    scheduled_at: string; // UTC ISO
    format: string;
    server_region: string | null;
    room_info: string | null;
    notes: string | null;
  };
}

const FORMATS: Array<{ value: MatchFormat; label: string }> = [
  { value: "bo1", label: "BO1" },
  { value: "bo3", label: "BO3" },
  { value: "bo5", label: "BO5" },
];

function toWibDatetimeLocal(utcIso: string): string {
  // WIB = UTC+7 → add 7*60 minutes
  const date = new Date(utcIso);
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + wibOffsetMs);
  // Format: "YYYY-MM-DDTHH:mm"
  return local.toISOString().slice(0, 16);
}

const ScrimEditForm = ({
  orgSlug,
  scrimId,
  divisions,
  initialValues,
}: ScrimEditFormProps) => {
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
          const res = await updateScrimAction(orgSlug, {
            scrim_id: scrimId,
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
          router.push(`/${orgSlug}/scrim/${scrimId}`);
        });
      }}
      className="space-y-4"
    >
      <Field label="Divisi" name="division_id" errors={fieldErrors["division_id"]}>
        <select
          name="division_id"
          required
          defaultValue={initialValues.division_id}
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
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
          placeholder="mis. Team Spartan"
          defaultValue={initialValues.opponent_name}
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Kontak lawan (opsional)"
        name="opponent_contact"
        errors={fieldErrors["opponent_contact"]}
      >
        <input
          name="opponent_contact"
          maxLength={120}
          placeholder="WA / Discord captain lawan"
          defaultValue={initialValues.opponent_contact ?? ""}
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
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
          defaultValue={toWibDatetimeLocal(initialValues.scheduled_at)}
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Format" name="format" errors={fieldErrors["format"]}>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <label
              key={f.value}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ui-elevated px-3 py-2 text-sm text-white/85 has-[input:checked]:bg-yellow-400 has-[input:checked]:text-black"
            >
              <input
                type="radio"
                name="format"
                value={f.value}
                defaultChecked={f.value === initialValues.format}
                className="sr-only"
              />
              {f.label}
            </label>
          ))}
        </div>
      </Field>

      <Field
        label="Server / region (opsional)"
        name="server_region"
        errors={fieldErrors["server_region"]}
      >
        <input
          name="server_region"
          maxLength={60}
          placeholder="mis. SEA, ID, Asia"
          defaultValue={initialValues.server_region ?? ""}
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Room info (opsional)"
        name="room_info"
        errors={fieldErrors["room_info"]}
      >
        <input
          name="room_info"
          maxLength={500}
          placeholder="ID room + password"
          defaultValue={initialValues.room_info ?? ""}
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Catatan (opsional)" name="notes" errors={fieldErrors["notes"]}>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          placeholder="Catatan strategis, request map, dsb"
          defaultValue={initialValues.notes ?? ""}
          className="w-full rounded-md border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
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
        Simpan Perubahan
      </button>
    </form>
  );
};
export { ScrimEditForm };

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
      <label htmlFor={name} className="text-xs font-medium text-ui-text">
        {label}
      </label>
      {children}
      {errors && errors.length > 0 ? (
        <p className="text-xs text-rose-400">{errors[0]}</p>
      ) : null}
    </div>
  );
}
