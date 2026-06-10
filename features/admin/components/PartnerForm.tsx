"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NumberInput } from "@/components/ui/number-input";
import { ImageUpload } from "./ImageUpload";
import { createPartner, updatePartner } from "@/features/admin/actions";
import type { Partner } from "@/features/admin/queries";

interface Props {
  partner?: Partner;
  onDone: () => void;
}

const PartnerForm = ({ partner, onDone }: Props) => {
  const [name, setName] = useState(partner?.name ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(partner?.logo_url ?? null);
  const [websiteUrl, setWebsiteUrl] = useState(partner?.website_url ?? "");
  const [sortOrder, setSortOrder] = useState<number>(partner?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(partner?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error("Nama wajib diisi"); return; }
    setSaving(true);
    const data = {
      name,
      logo_url: logoUrl,
      website_url: websiteUrl || null,
      sort_order: sortOrder,
      is_active: isActive,
    };
    const result = partner
      ? await updatePartner(partner.id, data)
      : await createPartner(data);
    setSaving(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(partner ? "Partner diperbarui" : "Partner ditambahkan");
    onDone();
  };

  const inputClass = "w-full border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text outline-none transition focus:border-[#F5C400]/50 placeholder:text-ui-text-muted";
  const labelClass = "mb-1 block text-xs font-medium text-ui-text-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-ui-border bg-ui-bg p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nama *</label>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Website URL</label>
          <input className={inputClass} value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://" />
        </div>
      </div>
      <div className="flex items-end gap-6">
        <ImageUpload value={logoUrl} onChange={setLogoUrl} folder="partners" label="Logo" />
        <div>
          <label className={labelClass}>Sort Order</label>
          <NumberInput
            value={sortOrder}
            min={0}
            onChange={e => setSortOrder(Number(e.target.value))}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ui-text-2">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-[#F5C400]" />
          Aktif
        </label>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="cursor-pointer border border-[#F5C400] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50">
          {saving ? "Menyimpan..." : partner ? "Simpan" : "Tambah"}
        </button>
        <button type="button" onClick={onDone} className="cursor-pointer border border-ui-border px-5 py-2 text-xs font-bold uppercase tracking-wider text-ui-text-2 transition hover:border-ui-text hover:text-ui-text">
          Batal
        </button>
      </div>
    </form>
  );
};
export { PartnerForm };
