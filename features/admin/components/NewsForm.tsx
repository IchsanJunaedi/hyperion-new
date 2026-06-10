"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "./ImageUpload";
import { createNewsPostAction, updateNewsPostAction } from "@/features/admin/actions";
import { slugify } from "@/lib/utils/slugify";
import type { NewsPost } from "@/features/admin/queries";

interface Props {
  entry?: NewsPost;
  onDone: () => void;
}

const CATEGORIES = [
  { value: "unggulan", label: "Unggulan" },
  { value: "turnamen", label: "Turnamen" },
  { value: "update_tim", label: "Update Tim" }
];

const NewsForm = ({ entry, onDone }: Props) => {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [slug, setSlug] = useState(entry?.slug ?? "");
  const [excerpt, setExcerpt] = useState(entry?.excerpt ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(entry?.cover_image_url ?? null);
  const [status, setStatus] = useState<'draft' | 'published'>(entry?.status ?? "draft");
  const [category, setCategory] = useState<string | null>(entry?.category ?? null);
  const [readTime, setReadTime] = useState<string>(entry?.read_time != null ? String(entry.read_time) : "");
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!entry);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const inputClass = "w-full border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text outline-none transition focus:border-[#F5C400]/50 placeholder:text-ui-text-muted";
  const labelClass = "mb-1 block text-xs font-medium text-ui-text-2";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) { toast.error("Title dan slug wajib diisi"); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content: content.trim() || null,
      cover_image_url: coverUrl,
      status,
      category: category || null,
      read_time: readTime ? parseInt(readTime, 10) : null,
    };
    const result = entry
      ? await updateNewsPostAction(entry.id, payload)
      : await createNewsPostAction(payload);
    setSaving(false);
    if (!result.ok) { toast.error((result as { ok: false; message: string }).message); return; }
    toast.success(entry ? "Artikel diperbarui" : "Artikel dibuat");
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-ui-border bg-ui-bg p-5">
      <div>
        <label className={labelClass}>Title *</label>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Juara 1 di MPL Season 15" required />
      </div>
      <div>
        <label className={labelClass}>Slug *</label>
        <input className={inputClass} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} placeholder="juara-1-di-mpl-season-15" required />
        <p className="mt-1 text-[10px] text-ui-text-muted">URL: /news/{slug || "..."}</p>
      </div>
      <div>
        <label className={labelClass}>Excerpt (ringkasan singkat)</label>
        <textarea className={inputClass + " min-h-[60px] resize-y"} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Hyperion Team berhasil meraih gelar juara..." />
      </div>
      <div>
        <label className={labelClass}>Konten artikel</label>
        <textarea className={inputClass + " min-h-[160px] resize-y"} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tulis konten artikel di sini..." />
      </div>
      <div>
        <ImageUpload value={coverUrl} onChange={setCoverUrl} folder="news" label="Cover Image (opsional)" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Kategori</label>
          <select
            className={inputClass}
            value={category ?? ""}
            onChange={(e) => setCategory(e.target.value || null)}
          >
            <option value="" className="bg-ui-bg text-ui-text-muted">— Pilih Kategori (opsional) —</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-ui-bg text-ui-text">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Waktu Baca (menit, opsional)</label>
          <input
            type="number"
            min="1"
            className={inputClass}
            value={readTime}
            onChange={(e) => setReadTime(e.target.value)}
            placeholder="5"
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <div className="flex gap-2">
          {(["draft", "published"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition cursor-pointer ${status === s ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-ui-border text-ui-text-muted hover:border-[#F5C400]/50 hover:text-[#F5C400]"}`}>
              {s === "draft" ? "Draft" : "Published"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="cursor-pointer border border-[#F5C400] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50">
          {saving ? "Menyimpan..." : entry ? "Simpan" : "Buat Artikel"}
        </button>
        <button type="button" onClick={onDone}
          className="cursor-pointer border border-ui-border px-5 py-2 text-xs font-bold uppercase tracking-wider text-ui-text-2 transition hover:border-ui-text hover:text-ui-text">
          Batal
        </button>
      </div>
    </form>
  );
};
export { NewsForm };
