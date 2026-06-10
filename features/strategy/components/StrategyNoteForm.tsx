"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createStrategyNoteAction } from "../actions";

interface StrategyNoteFormProps {
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
}

const StrategyNoteForm = ({ orgSlug, divisions }: StrategyNoteFormProps) => {
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
          const res = await createStrategyNoteAction(orgSlug, {
            title: fd.get("title"),
            content: fd.get("content"),
            division_id: fd.get("division_id") || null,
            tags: fd.get("tags"),
            visibility: fd.get("visibility"),
          });
          if (!res.ok) {
            setGlobalError(res.message);
            setFieldErrors(res.fieldErrors ?? {});
            return;
          }
          router.push(`/${orgSlug}/strategy/${res.note.id}`);
        });
      }}
      className="space-y-4"
    >
      <Field label="Judul" name="title" errors={fieldErrors["title"]}>
        <input
          name="title"
          required
          maxLength={200}
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Isi catatan" name="content" errors={fieldErrors["content"]}>
        <textarea
          name="content"
          required
          rows={12}
          maxLength={20000}
          className="w-full rounded-md border border-ui-border bg-ui-surface px-3 py-2 font-mono text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Divisi (opsional)" name="division_id" errors={fieldErrors["division_id"]}>
        <select
          name="division_id"
          defaultValue=""
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        >
          <option value="">Semua divisi</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tags (pisahkan dengan koma)" name="tags" errors={fieldErrors["tags"]}>
        <input
          name="tags"
          maxLength={500}
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Visibilitas" name="visibility" errors={fieldErrors["visibility"]}>
        <select
          name="visibility"
          defaultValue="division"
          className="h-10 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400 focus:outline-none"
        >
          <option value="public">Publik (semua member org)</option>
          <option value="division">Divisi saja</option>
          <option value="private">Pribadi (hanya saya)</option>
        </select>
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
        Simpan catatan
      </button>
    </form>
  );
};
export { StrategyNoteForm };

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
