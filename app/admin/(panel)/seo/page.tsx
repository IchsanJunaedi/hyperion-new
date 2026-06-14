import { getSiteSettings } from "@/features/admin/queries";
import { SettingsForm, type SettingsField } from "@/features/admin/components/SettingsForm";

export const dynamic = "force-dynamic";

const SEO_FIELDS: SettingsField[] = [
  { key: "seo_home_title", label: "Homepage — Title", placeholder: "Hyperion Team — Organisasi Esports Indonesia" },
  { key: "seo_home_description", label: "Homepage — Description", placeholder: "Platform manajemen tim esports profesional.", multiline: true },
  { key: "seo_about_title", label: "About — Title", placeholder: "Tentang Kami — Hyperion Team" },
  { key: "seo_about_description", label: "About — Description", placeholder: "Pelajari lebih lanjut tentang Hyperion Team.", multiline: true },
  { key: "seo_contact_title", label: "Contact — Title", placeholder: "Kontak — Hyperion Team" },
  { key: "seo_contact_description", label: "Contact — Description", placeholder: "Hubungi Hyperion Team.", multiline: true },
  { key: "seo_rekrutmen_title", label: "Rekrutmen — Title", placeholder: "Rekrutmen Terbuka — Hyperion Team" },
  { key: "seo_rekrutmen_description", label: "Rekrutmen — Description", placeholder: "Lihat posisi yang sedang dibuka.", multiline: true },
  { key: "seo_divisions_title", label: "Divisions — Title", placeholder: "Divisi — Hyperion Team" },
  { key: "seo_divisions_description", label: "Divisions — Description", placeholder: "Lihat semua divisi Hyperion Team.", multiline: true },
  { key: "seo_og_image", label: "Default OG Image", placeholder: "https://...", type: "image" },
  { key: "default_news_image", label: "Default News Cover Image (Hyperion Logo)", placeholder: "/brand/logo.jpg", type: "image" },
];

export default async function AdminSeoPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-ui-border bg-ui-bg px-6">
        <div className="text-sm text-ui-text-2">
          Admin <span className="text-ui-text-muted">/</span>{" "}
          <span className="text-ui-text-dim">SEO</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-8 py-10">
        <SettingsForm fields={SEO_FIELDS} initialValues={settings} title="SEO & Meta Tags" />
      </main>
    </>
  );
}
