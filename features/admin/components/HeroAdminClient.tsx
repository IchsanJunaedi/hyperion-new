"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertSiteSettings } from "@/features/admin/actions";
import { ImageUpload } from "@/features/admin/components/ImageUpload";

const TEXT_FIELDS = [
  { key: "hero_eyebrow", label: "Eyebrow Text (kecil di atas judul)", placeholder: "Est. 2020 — Palembang, Indonesia" },
  { key: "hero_tagline", label: "Tagline (teks kecil bawah judul)", placeholder: "Empowering Young Talents to Rise and Rule." },
  { key: "hero_cta_label", label: "Label Tombol CTA", placeholder: "Join Us" },
  { key: "hero_cta_href", label: "URL Tombol CTA", placeholder: "/register" },
];

interface Props {
  initialValues: Record<string, string>;
}

const HeroAdminClient = ({ initialValues }: Props) => {
  const [bgUrl, setBgUrl] = useState<string | null>(initialValues["hero_background_url"] ?? null);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, initialValues[f.key] ?? ""]))
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await upsertSiteSettings({
      ...values,
      hero_background_url: bgUrl ?? "",
    });
    setSaving(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Pengaturan hero disimpan");
  };

  const inputClass = "w-full border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text outline-none transition focus:border-[#F5C400]/50 placeholder:text-ui-text-muted";
  const labelClass = "mb-1 block text-xs font-medium text-ui-text-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-xl font-black uppercase tracking-tight text-ui-text">Hero Section</h1>

      {/* Background image */}
      <div className="rounded border border-ui-border bg-ui-bg p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ui-text-2">Background Image</p>
        <p className="mb-4 text-xs text-ui-text-muted">
          Gambar ini ditampilkan sebagai background hero. Kalau kosong, hero menggunakan foto dari Gallery.
          Saat countdown aktif, gambar ini akan lebih terlihat (opacity lebih tinggi).
        </p>

        {bgUrl ? (
          <div className="relative">
            {/* Preview */}
            <div className="relative mb-3 h-40 w-full overflow-hidden rounded border border-ui-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bgUrl} alt="Hero background preview" className="h-full w-full object-cover" style={{ filter: "brightness(0.6)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-bold uppercase tracking-widest text-ui-text-muted">Preview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ImageUpload
                value={null}
                onChange={(url) => { if (url) setBgUrl(url); }}
                folder="hero-backgrounds"
                label="Ganti Gambar"
              />
              <button
                type="button"
                onClick={() => setBgUrl(null)}
                className="cursor-pointer border border-ui-border px-3 py-1.5 text-xs text-ui-text-muted transition hover:border-red-500/50 hover:text-red-400"
              >
                Hapus Background
              </button>
            </div>
          </div>
        ) : (
          <ImageUpload
            value={null}
            onChange={(url) => { if (url) setBgUrl(url); }}
            folder="hero-backgrounds"
            label="Upload Background Hero"
          />
        )}
      </div>

      {/* Text settings */}
      <div className="space-y-4 rounded border border-ui-border bg-ui-bg p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-text-2">Teks & CTA</p>
        {TEXT_FIELDS.map((field) => (
          <div key={field.key}>
            <label className={labelClass}>{field.label}</label>
            <input
              className={inputClass}
              value={values[field.key] ?? ""}
              placeholder={field.placeholder}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="cursor-pointer border border-[#F5C400] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
};

export { HeroAdminClient };
