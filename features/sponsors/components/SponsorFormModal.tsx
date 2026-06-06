"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { createSponsorAction, updateSponsorAction } from "../actions";
import type { Sponsor, SponsorStatus } from "../queries";

/** Format angka jadi 1.000.000 (pemisah ribuan titik) untuk display */
function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

/** Ambil angka murni dari string berformat (hapus titik) */
function stripThousands(formatted: string): string {
  return formatted.replace(/\./g, "");
}

const STATUS_OPTIONS: Array<{ value: SponsorStatus; label: string }> = [
  { value: "prospect", label: "Prospek" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Tidak Aktif" },
  { value: "ended", label: "Selesai" },
];

const EMPTY = {
  name: "", status: "prospect" as SponsorStatus, logo_url: "",
  contact_name: "", contact_email: "", contact_phone: "",
  deal_value: "", currency: "IDR", start_date: "", end_date: "", notes: "",
};

interface SponsorFormModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  editing?: Sponsor | null;
  onSaved: (id: string) => void;
  /** Pass when owner is creating from multi-org context so modal can show a team selector. */
  organizations?: Array<{ id: string; name: string }>;
}

const SponsorFormModal = ({ open, onClose, orgId, editing, onSaved, organizations }: SponsorFormModalProps) => {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(EMPTY);
  const [logoUploading, setLogoUploading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(orgId);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync selectedOrgId when orgId prop changes (tab switch)
  useEffect(() => {
    setSelectedOrgId(orgId);
  }, [orgId]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify.error("Logo maksimal 5MB");
      return;
    }
    setLogoUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${selectedOrgId}/sponsors/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("org-logos").upload(path, file, { upsert: true });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
      set("logo_url", data.publicUrl);
      notify.success("Logo diupload");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Gagal upload logo");
    } finally {
      setLogoUploading(false);
    }
  }

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name,
          status: editing.status,
          logo_url: editing.logo_url ?? "",
          contact_name: editing.contact_name ?? "",
          contact_email: editing.contact_email ?? "",
          contact_phone: editing.contact_phone ?? "",
          deal_value: editing.deal_value ? formatThousands(editing.deal_value.toString()) : "",
          currency: editing.currency,
          start_date: editing.start_date ?? "",
          end_date: editing.end_date ?? "",
          notes: editing.notes ?? "",
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, editing]);

  if (!open) return null;

  function set(key: keyof typeof EMPTY, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSave() {
    if (!form.name.trim()) { notify.error("Nama sponsor tidak boleh kosong"); return; }
    const targetOrgId = editing ? orgId : selectedOrgId;
    // Strip thousand-separator dots before sending to server
    const payload = { ...form, deal_value: stripThousands(form.deal_value) };
    startTransition(async () => {
      if (editing) {
        const res = await updateSponsorAction(targetOrgId, editing.id, payload);
        if (res.ok) {
          notify.success("Sponsor diperbarui");
          onSaved(editing.id);
          onClose();
        } else {
          notify.error(res.message);
        }
      } else {
        const res = await createSponsorAction(targetOrgId, payload);
        if (res.ok) {
          notify.success("Sponsor ditambahkan");
          onSaved(res.id!);
          onClose();
        } else {
          notify.error(res.message);
        }
      }
    });
  }

  const inputCls = "w-full rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30";
  const labelCls = "mb-1 block text-xs font-medium text-white/60";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-12">
      <div className="w-full max-w-lg rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2D2D2D] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">
            {editing ? "Edit Sponsor" : "Tambah Sponsor"}
          </h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Org selector — only in create mode with multiple orgs */}
          {!editing && organizations && organizations.length > 1 && (
            <div>
              <label className={labelCls}>Tim / Organisasi *</label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white outline-none focus:border-white/30 cursor-pointer"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className="bg-zinc-900">
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Name */}
          <div>
            <label className={labelCls}>Nama Sponsor *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("status", s.value)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs transition",
                    form.status === s.value
                      ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                      : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/60",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className={labelCls}>Logo (opsional)</label>
            <div className="flex items-center gap-3">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="h-12 w-12 rounded-md object-contain bg-[#141414] border border-[#2D2D2D]" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-[#2D2D2D] bg-[#141414] text-white/30">
                  <ImagePlus className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <button
                  type="button"
                  disabled={logoUploading}
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#2D2D2D] px-3 text-xs text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  {logoUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                  {logoUploading ? "Mengupload..." : "Upload logo"}
                </button>
                <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                {form.logo_url && (
                  <button type="button" onClick={() => set("logo_url", "")} className="block text-[10px] text-white/30 hover:text-red-400 cursor-pointer">
                    Hapus logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/30">Kontak</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>Nama PIC</label>
                <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>No. HP / WA</label>
                <input value={form.contact_phone} inputMode="numeric" maxLength={15} onChange={(e) => set("contact_phone", e.target.value.replace(/\D/g, ""))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Deal */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/30">Deal</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>Nilai Deal</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.deal_value}
                    onChange={(e) => {
                      const formatted = formatThousands(e.target.value);
                      set("deal_value", formatted);
                    }}
                    className={cn(inputCls, "pr-3")}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Mata Uang</label>
                <div className="flex gap-1">
                  {["IDR", "USD"].map((c) => (
                    <button key={c} type="button" onClick={() => set("currency", c)}
                      className={cn("flex-1 cursor-pointer rounded-md border py-2 text-xs font-mono transition",
                        form.currency === c ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-[#2D2D2D] text-white/40 hover:border-white/20"
                      )}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Mulai</label>
                <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Berakhir</label>
                <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Deskripsi / Catatan</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3}
              className={cn(inputCls, "resize-none")} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-md border border-[#2D2D2D] py-2 text-sm text-white/60 transition hover:bg-white/5">
              Batal
            </button>
            <button type="button" onClick={handleSave} disabled={pending}
              className="flex-1 cursor-pointer rounded-md bg-yellow-400 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50">
              {pending ? "Menyimpan..." : editing ? "Simpan" : "Tambahkan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export { SponsorFormModal };
