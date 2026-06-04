"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NumberInput } from "@/components/ui/number-input";
import { ImageUpload } from "./ImageUpload";
import { createDivisionPublic, updateDivisionPublic } from "@/features/admin/actions";
import type { DivisionPublic } from "@/features/admin/queries";

interface Props {
  division?: DivisionPublic;
  onDone: () => void;
}

const DivisionPublicForm = ({ division, onDone }: Props) => {
  const [name, setName] = useState(division?.name ?? "");
  const [description, setDescription] = useState(division?.description ?? "");
  const [iconUrl, setIconUrl] = useState<string | null>(division?.icon_url ?? null);
  const [sortOrder, setSortOrder] = useState<number>(division?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(division?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error("Nama wajib diisi"); return; }
    setSaving(true);
    const data = {
      name,
      description: description || null,
      icon_url: iconUrl,
      sort_order: sortOrder,
      is_active: isActive,
    };
    const result = division
      ? await updateDivisionPublic(division.id, data)
      : await createDivisionPublic(data);
    setSaving(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(division ? "Division diperbarui" : "Division ditambahkan");
    onDone();
  };

  const inputClass = "w-full border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] outline-none transition focus:border-[#F5C400]/50 placeholder:text-[#6B6A68]";
  const labelClass = "mb-1 block text-xs font-medium text-[#9B9A97]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-[#2D2D2D] bg-[#141414] p-5">
      <div>
        <label className={labelClass}>Nama *</label>
        <input className={inputClass} value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className={labelClass}>Deskripsi</label>
        <textarea
          className={inputClass + " min-h-[60px] resize-y"}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div className="flex items-end gap-6">
        <ImageUpload value={iconUrl} onChange={setIconUrl} folder="divisions" label="Icon" />
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
          {saving ? "Menyimpan..." : division ? "Simpan" : "Tambah"}
        </button>
        <button type="button" onClick={onDone} className="cursor-pointer border border-[#2D2D2D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#9B9A97] transition hover:border-[#E5E2E1] hover:text-[#E5E2E1]">
          Batal
        </button>
      </div>
    </form>
  );
};
export { DivisionPublicForm };
