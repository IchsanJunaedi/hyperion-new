"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NumberInput } from "@/components/ui/number-input";
import { ImageUpload } from "./ImageUpload";
import { createAchievement, updateAchievement } from "@/features/admin/actions";
import type { Achievement } from "@/features/admin/queries";

interface Props {
  entry?: Achievement;
  onDone: () => void;
}

const AchievementForm = ({ entry, onDone }: Props) => {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [placement, setPlacement] = useState<number>(entry?.placement ?? 1);
  const [achievedAt, setAchievedAt] = useState(entry?.achieved_at?.slice(0, 10) ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(entry?.image_url ?? null);
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text outline-none transition focus:border-[#F5C400]/50 placeholder:text-ui-text-muted";
  const labelClass = "mb-1 block text-xs font-medium text-ui-text-2";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !achievedAt) {
      toast.error("Title dan tanggal wajib diisi");
      return;
    }
    setSaving(true);
    const data = {
      title,
      description: description || null,
      placement: placement || null,
      achieved_at: achievedAt,
      image_url: imageUrl,
    };
    const result = entry
      ? await updateAchievement(entry.id, data)
      : await createAchievement(data);
    setSaving(false);
    if (!result.ok) {
      toast.error((result as { ok: false; message: string }).message);
      return;
    }
    toast.success(entry ? "Achievement diperbarui" : "Achievement ditambahkan");
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded border border-ui-border bg-ui-bg p-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Title *</label>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Juara 1 — Tournament Name"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Placement (1-3)</label>
          <NumberInput
            value={placement}
            min={1}
            max={3}
            onChange={(e) => setPlacement(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>Tanggal *</label>
          <input
            type="date"
            className={inputClass}
            value={achievedAt}
            onChange={(e) => setAchievedAt(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Deskripsi (opsional)</label>
        <textarea
          className={inputClass + " min-h-[60px] resize-y"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          folder="achievements"
          label="Poster / Gambar (opsional)"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer border border-[#F5C400] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : entry ? "Simpan" : "Tambah"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="cursor-pointer border border-ui-border px-5 py-2 text-xs font-bold uppercase tracking-wider text-ui-text-2 transition hover:border-ui-text hover:text-ui-text"
        >
          Batal
        </button>
      </div>
    </form>
  );
};
export { AchievementForm };
