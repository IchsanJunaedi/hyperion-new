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
  { value: "bo2", label: "BO2" },
  { value: "bo3", label: "BO3" },
  { value: "bo5", label: "BO5" },
  { value: "bo7", label: "BO7" },
  { value: "4match", label: "4 Match" },
];

const ScrimForm = ({ orgSlug, divisions }: ScrimFormProps) => {
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
        const roomId = (fd.get("room_id") as string) || "";
        const roomPass = (fd.get("room_password") as string) || "";
        const roomInfo = [
          roomId && `ID: ${roomId}`,
          roomPass && `Pass: ${roomPass}`,
        ]
          .filter(Boolean)
          .join(" | ");
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
            room_info: roomInfo || undefined,
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
      className="space-y-5"
    >
      {/* Divisi - Full Width */}
      <Field label="Divisi" name="division_id" errors={fieldErrors["division_id"]}>
        {divisions.length === 1 ? (
          <>
            <input type="hidden" name="division_id" value={divisions[0]!.id} />
            <p className="h-10 flex items-center rounded-lg border border-white/10 bg-zinc-950/40 px-3 text-sm text-white/70">
              {divisions[0]!.name}
            </p>
          </>
        ) : (
          <select
            name="division_id"
            required
            defaultValue=""
            className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
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
            className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
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
            className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
          />
        </Field>
      </div>

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
          className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
        />
      </Field>

      {/* Format - Pill Selects */}
      <Field label="Format" name="format" errors={fieldErrors["format"]}>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f, i) => (
            <label
              key={f.value}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-zinc-800/40 px-4 py-2 text-xs font-semibold text-white/80 transition-all duration-300 hover:bg-zinc-700/40 has-[input:checked]:bg-yellow-400 has-[input:checked]:text-black has-[input:checked]:border-yellow-400"
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
          className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      {/* Room ID & Room Password - Side by Side */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Room ID (opsional)" name="room_id" errors={fieldErrors["room_info"]}>
          <input
            name="room_id"
            maxLength={100}
            placeholder="mis. 123456"
            className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
          />
        </Field>

        <Field label="Room Password (opsional)" name="room_password" errors={undefined}>
          <input
            name="room_password"
            maxLength={100}
            placeholder="mis. hyperion"
            className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
          />
        </Field>
      </div>

      {/* Catatan - Full Width */}
      <Field label="Catatan (opsional)" name="notes" errors={fieldErrors["notes"]}>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
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
