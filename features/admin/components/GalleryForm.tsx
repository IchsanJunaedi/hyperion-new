"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { NumberInput } from "@/components/ui/number-input";
import { ImageUpload } from "./ImageUpload";
import { createGalleryEntry, updateGalleryEntry } from "@/features/admin/actions";
import type { GalleryEntry } from "@/features/admin/queries";

interface Props {
  entry?: GalleryEntry;
  onDone: () => void;
}

const GalleryForm = ({ entry, onDone }: Props) => {
  const [slug, setSlug] = useState(entry?.slug ?? "");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [division, setDivision] = useState(entry?.division ?? "");
  const [tournamentDate, setTournamentDate] = useState(entry?.tournament_date ?? "");
  const [position, setPosition] = useState(entry?.position ?? "");
  const [status, setStatus] = useState(entry?.status ?? "Online");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [sortOrder, setSortOrder] = useState<number>(entry?.sort_order ?? 0);
  const [logoUrl, setLogoUrl] = useState<string | null>(entry?.logo_url ?? null);
  const [previewImages, setPreviewImages] = useState<string[]>(entry?.preview_images ?? []);
  const [saving, setSaving] = useState(false);

  const autoSlug = (val: string) =>
    val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!entry) setSlug(autoSlug(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !title || !description) {
      toast.error("Slug, title, dan deskripsi wajib diisi");
      return;
    }
    setSaving(true);
    const data = {
      slug, title, division, tournament_date: tournamentDate,
      position, status, logo_url: logoUrl,
      preview_images: previewImages, description, sort_order: sortOrder,
    };
    const result = entry
      ? await updateGalleryEntry(entry.id, data)
      : await createGalleryEntry(data);
    setSaving(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(entry ? "Entry diperbarui" : "Entry ditambahkan");
    onDone();
  };

  const inputClass = "w-full border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] outline-none transition focus:border-[#F5C400]/50 placeholder:text-[#6B6A68]";
  const labelClass = "mb-1 block text-xs font-medium text-[#9B9A97]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-[#2D2D2D] bg-[#141414] p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input className={inputClass} value={title} onChange={e => handleTitleChange(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input className={inputClass} value={slug} onChange={e => setSlug(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Division</label>
          <input className={inputClass} value={division} onChange={e => setDivision(e.target.value)} placeholder="Mobile Legends: Bang Bang" />
        </div>
        <div>
          <label className={labelClass}>Tahun / Tanggal</label>
          <input className={inputClass} value={tournamentDate} onChange={e => setTournamentDate(e.target.value)} placeholder="2024" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Position / Rank</label>
          <input className={inputClass} value={position} onChange={e => setPosition(e.target.value)} placeholder="Champion" />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Sort Order</label>
          <NumberInput
            value={sortOrder}
            min={0}
            onChange={e => setSortOrder(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Deskripsi *</label>
        <textarea
          className={inputClass + " min-h-[80px] resize-y"}
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-6">
        <ImageUpload value={logoUrl} onChange={setLogoUrl} folder="gallery" label="Logo (opsional)" />
        <div>
          <p className="mb-1.5 text-xs font-medium text-[#9B9A97]">Preview Images</p>
          <div className="flex flex-wrap gap-2">
            {previewImages.map((url, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-32 object-cover border border-[#2D2D2D]" />
                <button
                  type="button"
                  onClick={() => setPreviewImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <ImageUpload
              value={null}
              onChange={(url) => { if (url) setPreviewImages(prev => [...prev, url]); }}
              folder="gallery"
              label="Tambah Gambar"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="cursor-pointer border border-[#F5C400] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50">
          {saving ? "Menyimpan..." : entry ? "Simpan" : "Tambah"}
        </button>
        <button type="button" onClick={onDone} className="cursor-pointer border border-[#2D2D2D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#9B9A97] transition hover:border-[#E5E2E1] hover:text-[#E5E2E1]">
          Batal
        </button>
      </div>
    </form>
  );
};
export { GalleryForm };
