import { getSiteSettings } from "@/features/admin/queries";
import { SettingsForm, type SettingsField } from "@/features/admin/components/SettingsForm";

export const dynamic = "force-dynamic";

const JOIN_FIELDS: SettingsField[] = [
  { key: "join_eyebrow", label: "Eyebrow Text", placeholder: "#HypeWin" },
  { key: "join_title_line1", label: "Judul Baris 1", placeholder: "Ready To" },
  { key: "join_title_line2", label: "Judul Baris 2 (warna kuning)", placeholder: "Join The Team?" },
  { key: "join_description", label: "Deskripsi", placeholder: "Unleash your potential...", multiline: true },
  { key: "join_fine_print", label: "Fine Print (teks kecil di bawah tombol)", placeholder: "Gratis · Tanpa syarat umur minimum" },
];

export default async function AdminJoinPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-ui-border bg-ui-bg px-6">
        <div className="text-sm text-ui-text-2">
          Admin <span className="text-ui-text-muted">/</span>{" "}
          <span className="text-ui-text-dim">Join Section</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-8 py-10">
        <SettingsForm fields={JOIN_FIELDS} initialValues={settings} title="Join Section" />
      </main>
    </>
  );
}
