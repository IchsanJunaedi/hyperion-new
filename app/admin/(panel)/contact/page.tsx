import { getSiteSettings } from "@/features/admin/queries";
import { SettingsForm, type SettingsField } from "@/features/admin/components/SettingsForm";

export const dynamic = "force-dynamic";

const CONTACT_FIELDS: SettingsField[] = [
  { key: "contact_instagram_url", label: "Instagram URL", placeholder: "https://www.instagram.com/hyperionteam.id/" },
  { key: "contact_instagram_handle", label: "Instagram Handle", placeholder: "@hyperionteam.id" },
  { key: "contact_email", label: "Email", placeholder: "hyperionteam.id@gmail.com" },
  { key: "contact_whatsapp", label: "WhatsApp (nomor, opsional)", placeholder: "+628123456789" },
  { key: "contact_location", label: "Lokasi", placeholder: "Palembang, Sumatera Selatan" },
];

export default async function AdminContactPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Contact</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-8 py-10">
        <SettingsForm fields={CONTACT_FIELDS} initialValues={settings} title="Kontak & Sosial Media" />
      </main>
    </>
  );
}
