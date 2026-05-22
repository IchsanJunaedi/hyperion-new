"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { cn } from "@/lib/utils/cn";
import { createSponsorAction, updateSponsorAction } from "../actions";
import type { Sponsor, SponsorStatus } from "../queries";

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
}

export function SponsorFormModal({ open, onClose, orgId, editing, onSaved }: SponsorFormModalProps) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(EMPTY);

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
          deal_value: editing.deal_value?.toString() ?? "",
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
    startTransition(async () => {
      if (editing) {
        const res = await updateSponsorAction(orgId, editing.id, form);
        if (res.ok) {
          notify.success("Sponsor diperbarui");
          onSaved(editing.id);
          onClose();
        } else {
          notify.error(res.message);
        }
      } else {
        const res = await createSponsorAction(orgId, form);
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
            <label className={labelCls}>Logo URL (opsional)</label>
            <input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} className={inputCls} />
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
                <input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Deal */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/30">Deal</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>Nilai Deal</label>
                <input type="number" value={form.deal_value} onChange={(e) => set("deal_value", e.target.value)} min="0" className={inputCls} />
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
}
