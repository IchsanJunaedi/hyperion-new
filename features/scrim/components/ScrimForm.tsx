"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { createScrimAction } from "@/features/scrim/actions";
import type { MatchFormat } from "@/types/database";
import { useRouter } from "next/navigation";

interface ScrimFormProps {
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
  activePatchVersion?: string | null;
}

const FORMATS: Array<{ value: MatchFormat; label: string }> = [
  { value: "bo1", label: "BO1" },
  { value: "bo2", label: "BO2" },
  { value: "bo3", label: "BO3" },
  { value: "bo5", label: "BO5" },
  { value: "bo7", label: "BO7" },
  { value: "4match", label: "4 Match" },
];

const ScrimForm = ({ orgSlug, divisions, activePatchVersion }: ScrimFormProps) => {
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
            opponent_id: fd.get("opponent_id"),
            scheduled_at: fd.get("scheduled_at"),
            format: fd.get("format"),
            server_region: fd.get("server_region"),
            notes: fd.get("notes"),
            patch: fd.get("patch"),
          });
          if (!res.ok) {
            setGlobalError(res.message);
            setFieldErrors(res.fieldErrors ?? {});
            return;
          }
          router.push(`/${orgSlug}/scrim/${res.scrim.id}`);
        });
      }}
      className="space-y-5"
    >
      {/* Divisi - Full Width */}
      <Field label="Divisi" name="division_id" errors={fieldErrors["division_id"]}>
        {divisions.length === 1 ? (
          <>
            <input type="hidden" name="division_id" value={divisions[0]!.id} />
            <p className="h-10 flex items-center rounded-lg border border-ui-border bg-ui-bg/40 px-3 text-sm text-ui-text">
              {divisions[0]!.name}
            </p>
          </>
        ) : (
          <select
            name="division_id"
            required
            defaultValue=""
            className="h-10 w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
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

      {/* Nama Lawan & Kontak Lawan - Side by Side Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Nama lawan"
          name="opponent_name"
          errors={fieldErrors["opponent_name"]}
        >
          <input
            name="opponent_name"
            required
            maxLength={120}
            className="h-10 w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
          />
        </Field>

        <Field
          label="Kontak lawan"
          name="opponent_contact"
          errors={fieldErrors["opponent_contact"]}
        >
          <input
            name="opponent_contact"
            maxLength={120}
            placeholder="WA / Discord / email"
            className="h-10 w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
          />
        </Field>
      </div>

      {/* ID Musuh (perwakilan) - Full Width */}
      <Field
        label="ID musuh (perwakilan) — opsional"
        name="opponent_id"
        errors={fieldErrors["opponent_id"]}
      >
        <input
          name="opponent_id"
          maxLength={60}
          placeholder="ID in-game / username perwakilan lawan"
          className="h-10 w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 text-sm text-ui-text placeholder:text-ui-text-muted focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      {/* Jadwal - Full Width */}
      <Field
        label="Jadwal"
        name="scheduled_at"
        errors={fieldErrors["scheduled_at"]}
      >
        <input
          type="datetime-local"
          name="scheduled_at"
          required
          className="h-10 w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      {/* Format - Pill Selects */}
      <Field label="Format" name="format" errors={fieldErrors["format"]}>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f, i) => (
            <label
              key={f.value}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-ui-border bg-ui-elevated/40 px-4 py-2 text-xs font-semibold text-ui-text-2 transition-all duration-300 hover:bg-zinc-700/40 has-[input:checked]:bg-yellow-400 has-[input:checked]:text-black has-[input:checked]:border-yellow-400"
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

      {/* Server Region - Full Width */}
      <Field
        label="Server / region"
        name="server_region"
        errors={fieldErrors["server_region"]}
      >
        <input
          name="server_region"
          required
          maxLength={60}
          className="h-10 w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      {/* Catatan - Full Width */}
      <Field label="Catatan (opsional)" name="notes" errors={fieldErrors["notes"]}>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 py-2 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      {/* Patch - Full Width */}
      <Field label="Versi patch" name="patch" errors={fieldErrors["patch"]}>
        <input
          name="patch"
          value={activePatchVersion ?? "Tidak ada patch aktif"}
          readOnly
          disabled
          className="h-10 w-full rounded-lg border border-ui-border bg-ui-bg/20 px-3 text-sm text-ui-text-muted cursor-not-allowed"
        />
        <input type="hidden" name="patch" value={activePatchVersion ?? ""} />
      </Field>

      {globalError ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {globalError}
        </p>
      ) : null}

      {/* Buat Scrim Button - Bottom Right */}
      <div className="flex justify-end pt-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-yellow-400 px-6 text-sm font-bold text-black transition-all duration-300 hover:bg-yellow-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-yellow-400/10 hover:shadow-yellow-400/20"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Buat scrim
        </button>
      </div>
    </form>
  );
};
export { ScrimForm };

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
