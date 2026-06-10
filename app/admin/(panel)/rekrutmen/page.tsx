import { getSiteSettings } from "@/features/admin/queries";
import { SettingsForm, type SettingsField } from "@/features/admin/components/SettingsForm";

export const dynamic = "force-dynamic";

const REKRUTMEN_FIELDS: SettingsField[] = [
  { key: "rekrutmen_eyebrow", label: "Eyebrow Text (kecil, warna kuning)", placeholder: "Open Recruitment" },
  { key: "rekrutmen_title", label: "Judul Halaman (besar)", placeholder: "REKRUTMEN" },
  { key: "rekrutmen_description", label: "Deskripsi", placeholder: "Posisi yang sedang dibuka oleh Hyperion Team...", multiline: true },
];

export default async function AdminRekrutmenPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-ui-border bg-ui-bg px-6">
        <div className="text-sm text-ui-text-2">
          Admin <span className="text-ui-text-muted">/</span>{" "}
          <span className="text-ui-text-dim">Rekrutmen</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-8 py-10">
        <SettingsForm fields={REKRUTMEN_FIELDS} initialValues={settings} title="Halaman Rekrutmen" />
      </main>
    </>
  );
}
