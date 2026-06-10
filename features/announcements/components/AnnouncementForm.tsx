"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createAnnouncementAction } from "../actions";

interface AnnouncementFormProps {
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
}

const AnnouncementForm = ({ orgSlug, divisions }: AnnouncementFormProps) => {
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
            requires_ack: fd.get("requires_ack") === "on",
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
          id="title"
          name="title"
          required
          maxLength={200}
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Isi pengumuman" name="body" errors={fieldErrors["body"]}>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          maxLength={5000}
          className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Divisi (opsional — kosong = semua divisi)"
        name="division_id"
        errors={fieldErrors["division_id"]}
      >
        <select
          id="division_id"
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

      {/* Toggles Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Toggle Pin */}
        <div className="flex items-center justify-between rounded-xl bg-zinc-900/40 border border-white/5 px-4 py-3">
          <div className="space-y-0.5">
            <span className="block text-xs font-semibold text-ui-text">Pin di Halaman Utama</span>
            <span className="block text-[10px] text-ui-text-muted">Sematkan pengumuman di bagian atas</span>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" name="is_pinned" className="peer sr-only" />
            <div className="peer h-5 w-9 rounded-full bg-zinc-800 transition-all duration-300 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/60 after:transition-all after:content-[''] peer-checked:bg-yellow-400 peer-checked:after:translate-x-full peer-checked:after:bg-black peer-hover:bg-zinc-700/80"></div>
          </label>
        </div>

        {/* Toggle WA Blast */}
        <div className="flex items-center justify-between rounded-xl bg-zinc-900/40 border border-white/5 px-4 py-3">
          <div className="space-y-0.5">
            <span className="block text-xs font-semibold text-ui-text">Kirim WA Blast</span>
            <span className="block text-[10px] text-ui-text-muted">Kirim notifikasi WhatsApp ke member</span>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" name="send_wa_blast" className="peer sr-only" />
            <div className="peer h-5 w-9 rounded-full bg-zinc-800 transition-all duration-300 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/60 after:transition-all after:content-[''] peer-checked:bg-yellow-400 peer-checked:after:translate-x-full peer-checked:after:bg-black peer-hover:bg-zinc-700/80"></div>
          </label>
        </div>

        {/* Toggle Acknowledgement Required */}
        <div className="flex items-center justify-between rounded-xl bg-zinc-900/40 border border-orange-500/10 px-4 py-3 sm:col-span-2">
          <div className="space-y-0.5">
            <span className="block text-xs font-semibold text-orange-400">Wajib Konfirmasi Baca</span>
            <span className="block text-[10px] text-ui-text-muted">Member harus klik konfirmasi — kamu bisa lihat siapa yang belum</span>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" name="requires_ack" className="peer sr-only" />
            <div className="peer h-5 w-9 rounded-full bg-zinc-800 transition-all duration-300 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/60 after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:bg-black peer-hover:bg-zinc-700/80"></div>
          </label>
        </div>
      </div>

      {globalError ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {globalError}
        </p>
      ) : null}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-yellow-400 px-5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publikasikan
        </button>
      </div>
    </form>
  );
};
export { AnnouncementForm };

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
