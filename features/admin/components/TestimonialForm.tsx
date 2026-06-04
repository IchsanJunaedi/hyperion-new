"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NumberInput } from "@/components/ui/number-input";
import { ImageUpload } from "./ImageUpload";
import { createTestimonial, updateTestimonial } from "@/features/admin/actions";
import type { Testimonial } from "@/features/admin/queries";

interface Props {
  testimonial?: Testimonial;
  onDone: () => void;
}

const TestimonialForm = ({ testimonial, onDone }: Props) => {
  const [authorName, setAuthorName] = useState(testimonial?.author_name ?? "");
  const [authorRole, setAuthorRole] = useState(testimonial?.author_role ?? "");
  const [content, setContent] = useState(testimonial?.content ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(testimonial?.avatar_url ?? null);
  const [sortOrder, setSortOrder] = useState<number>(testimonial?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(testimonial?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName || !content) { toast.error("Nama dan konten wajib diisi"); return; }
    setSaving(true);
    const data = {
      author_name: authorName,
      author_role: authorRole,
      content,
      avatar_url: avatarUrl,
      sort_order: sortOrder,
      is_active: isActive,
    };
    const result = testimonial
      ? await updateTestimonial(testimonial.id, data)
      : await createTestimonial(data);
    setSaving(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(testimonial ? "Testimonial diperbarui" : "Testimonial ditambahkan");
    onDone();
  };

  const inputClass = "w-full border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] outline-none transition focus:border-[#F5C400]/50 placeholder:text-[#6B6A68]";
  const labelClass = "mb-1 block text-xs font-medium text-[#9B9A97]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-[#2D2D2D] bg-[#141414] p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nama *</label>
          <input className={inputClass} value={authorName} onChange={e => setAuthorName(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Role / Tim</label>
          <input className={inputClass} value={authorRole} onChange={e => setAuthorRole(e.target.value)} placeholder="Player of Team RRQ" />
        </div>
      </div>
      <div>
        <label className={labelClass}>Konten *</label>
        <textarea
          className={inputClass + " min-h-[100px] resize-y"}
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
      </div>
      <div className="flex items-end gap-6">
        <ImageUpload value={avatarUrl} onChange={setAvatarUrl} folder="testimonials" label="Foto" />
        <div>
          <label className={labelClass}>Sort Order</label>
          <NumberInput
            value={sortOrder}
            min={0}
            onChange={e => setSortOrder(Number(e.target.value))}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#9B9A97]">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-[#F5C400]" />
          Aktif
        </label>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="cursor-pointer border border-[#F5C400] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50">
          {saving ? "Menyimpan..." : testimonial ? "Simpan" : "Tambah"}
        </button>
        <button type="button" onClick={onDone} className="cursor-pointer border border-[#2D2D2D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#9B9A97] transition hover:border-[#E5E2E1] hover:text-[#E5E2E1]">
          Batal
        </button>
      </div>
    </form>
  );
};
export { TestimonialForm };
