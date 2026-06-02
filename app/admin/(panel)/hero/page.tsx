import { getSiteSettings } from "@/features/admin/queries";
import { SettingsForm, type SettingsField } from "@/features/admin/components/SettingsForm";

export const dynamic = "force-dynamic";

const HERO_FIELDS: SettingsField[] = [
  { key: "hero_eyebrow", label: "Eyebrow Text (kecil di atas judul)", placeholder: "Est. 2020 — Palembang, Indonesia" },
  { key: "hero_tagline", label: "Tagline (teks kecil bawah judul)", placeholder: "Empowering Young Talents to Rise and Rule." },
  { key: "hero_cta_label", label: "Label Tombol CTA", placeholder: "Join Us" },
  { key: "hero_cta_href", label: "URL Tombol CTA", placeholder: "/register" },
];

export default async function AdminHeroPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Hero</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-8 py-10">
        <SettingsForm fields={HERO_FIELDS} initialValues={settings} title="Hero Section" />
      </main>
    </>
  );
}
