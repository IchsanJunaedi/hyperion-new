"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { upsertSiteSettings } from "@/features/admin/actions";
import {
  createAboutAlumnusAction,
  deleteAboutAlumnusAction,
} from "@/features/admin/actions";
import { ImageUpload } from "@/features/admin/components/ImageUpload";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import type { AboutAlumnus } from "@/features/admin/queries";

const CARD_FIELDS = [
  { titleKey: "about_vision_title", bodyKey: "about_vision_body", defaultTitle: "Our Vision" },
  { titleKey: "about_mission_title", bodyKey: "about_mission_body", defaultTitle: "Our Mission" },
  { titleKey: "about_values_title", bodyKey: "about_values_body", defaultTitle: "Our Values" },
];

interface Props {
  initialSettings: Record<string, string>;
  initialAlumni: AboutAlumnus[];
}

const AboutAdminClient = ({ initialSettings, initialAlumni }: Props) => {
  const [settings, setSettings] = useState(initialSettings);
  const [savingCards, setSavingCards] = useState(false);

  const [alumni, setAlumni] = useState(initialAlumni);
  const [deleting, setDeleting] = useState<AboutAlumnus | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [addPending, setAddPending] = useState(false);

  const inputClass = "w-full border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] outline-none transition focus:border-[#F5C400]/50 placeholder:text-[#6B6A68]";
  const labelClass = "mb-1 block text-xs font-medium text-[#9B9A97]";

  const handleSaveCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCards(true);
    const result = await upsertSiteSettings(settings);
    setSavingCards(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Vision/Mission/Values disimpan");
  };

  const handleAddAlumnus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddPending(true);
    const result = await createAboutAlumnusAction({
      name: newName.trim(),
      role: newRole.trim(),
      image_url: newImage,
      sort_order: alumni.length,
    });
    setAddPending(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Alumni ditambahkan");
    setNewName(""); setNewRole(""); setNewImage(null);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteAboutAlumnusAction(deleting.id);
    setDeletePending(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Alumni dihapus");
    setAlumni((prev) => prev.filter((a) => a.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-black uppercase tracking-tight text-white">About Page</h1>

      {/* Vision / Mission / Values */}
      <form onSubmit={handleSaveCards}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#9B9A97]">Vision / Mission / Values</p>
        <div className="space-y-6">
          {CARD_FIELDS.map((f) => (
            <div key={f.titleKey} className="rounded border border-[#2D2D2D] bg-[#141414] p-5">
              <div className="mb-3">
                <label className={labelClass}>Judul</label>
                <input
                  className={inputClass}
                  value={settings[f.titleKey] ?? f.defaultTitle}
                  placeholder={f.defaultTitle}
                  onChange={(e) => setSettings((p) => ({ ...p, [f.titleKey]: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Isi</label>
                <textarea
                  className={inputClass + " min-h-[80px] resize-y"}
                  value={settings[f.bodyKey] ?? ""}
                  placeholder="Tulis isi kartu..."
                  onChange={(e) => setSettings((p) => ({ ...p, [f.bodyKey]: e.target.value }))}
                />
              </div>
            </div>
          ))}
        </div>
        <button type="submit" disabled={savingCards} className="mt-4 cursor-pointer border border-[#F5C400] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50">
          {savingCards ? "Menyimpan..." : "Simpan Cards"}
        </button>
      </form>

      {/* Alumni */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#9B9A97]">Alumni</p>

        {/* Existing alumni */}
        <div className="mb-6 space-y-2">
          {alumni.map((a) => (
            <div key={a.id} className="flex items-center gap-4 rounded border border-[#2D2D2D] bg-[#1a1a1a] px-4 py-3">
              {a.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image_url} alt={a.name} className="h-10 w-10 rounded-full object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#D4D4D4]">{a.name}</p>
                <p className="text-xs text-[#6B6A68]">{a.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleting(a)}
                className="cursor-pointer p-1.5 text-[#6B6A68] transition hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {alumni.length === 0 && (
            <p className="text-sm text-[#6B6A68]">Belum ada alumni. Tambahkan di bawah.</p>
          )}
        </div>

        {/* Add alumni form */}
        <form onSubmit={handleAddAlumnus} className="rounded border border-[#2D2D2D] bg-[#141414] p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-[#9B9A97]">Tambah Alumni</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nama</label>
              <input className={inputClass} value={newName} placeholder="RRQ Kaeya" onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <input className={inputClass} value={newRole} placeholder="Alumni · Player" onChange={(e) => setNewRole(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <ImageUpload value={newImage} onChange={setNewImage} folder="about-alumni" label="Foto Alumni" />
          </div>
          <button type="submit" disabled={addPending || !newName.trim()} className="mt-4 flex cursor-pointer items-center gap-2 border border-[#2D2D2D] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#9B9A97] transition hover:border-[#F5C400] hover:text-[#F5C400] disabled:opacity-50">
            <Plus className="h-3.5 w-3.5" />
            {addPending ? "Menambahkan..." : "Tambah Alumni"}
          </button>
        </form>
      </div>

      <ConfirmDeleteDialog
        open={!!deleting}
        title={`Hapus "${deleting?.name}"?`}
        message="Alumni akan dihapus permanen."
        confirmPhrase="HAPUS"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        pending={deletePending}
      />
    </div>
  );
};

export { AboutAdminClient };
