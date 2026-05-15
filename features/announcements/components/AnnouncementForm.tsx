"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createAnnouncementAction } from "../actions";

interface AnnouncementFormProps {
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
}

export function AnnouncementForm({ orgSlug, divisions }: AnnouncementFormProps) {
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
          const res = await createAnnouncementAction(orgSlug, {
            title: fd.get("title"),
            body: fd.get("body"),
            division_id: fd.get("division_id") || null,
            is_pinned: fd.get("is_pinned") === "on",
            send_wa_blast: fd.get("send_wa_blast") === "on",
          });
          if (!res.ok) {
            setGlobalError(res.message);
            setFieldErrors(res.fieldErrors ?? {});
            return;
          }
          router.push(`/${orgSlug}/announcements/${res.announcement.id}`);
        });
      }}
      className="space-y-4"
    >
      <Field label="Judul" name="title" errors={fieldErrors["title"]}>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="mis. Perubahan jadwal latihan"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Isi pengumuman" name="body" errors={fieldErrors["body"]}>
        <textarea
          name="body"
          required
          rows={6}
          maxLength={5000}
          placeholder="Tulis isi pengumuman di sini..."
          className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Divisi (opsional — kosong = semua divisi)"
        name="division_id"
        errors={fieldErrors["division_id"]}
      >
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

      <div className="flex flex-wrap gap-6">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            name="is_pinned"
            className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-yellow-400 focus:ring-yellow-400"
          />
          Pin di halaman utama
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            name="send_wa_blast"
            className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-yellow-400 focus:ring-yellow-400"
          />
          Kirim WA blast ke member
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
        Publikasikan
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
