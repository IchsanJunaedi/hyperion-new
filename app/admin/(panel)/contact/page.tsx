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
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-ui-border bg-ui-bg px-6">
        <div className="text-sm text-ui-text-2">
          Admin <span className="text-ui-text-muted">/</span>{" "}
          <span className="text-ui-text-dim">Contact</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-8 py-10">
        <SettingsForm fields={CONTACT_FIELDS} initialValues={settings} title="Kontak & Sosial Media" />
      </main>
    </>
  );
}
