import { getSiteSettings } from "@/features/admin/queries";
import { SettingsForm, type SettingsField } from "@/features/admin/components/SettingsForm";

export const dynamic = "force-dynamic";

const FOOTER_FIELDS: SettingsField[] = [
  { key: "footer_tagline", label: "Tagline (deskripsi brand di footer)", placeholder: "Empowering Young Talents...", multiline: true },
  { key: "footer_instagram_handle", label: "Instagram Handle", placeholder: "@hyperionteam.id" },
  { key: "footer_instagram_url", label: "Instagram URL", placeholder: "https://www.instagram.com/hyperionteam.id/" },
  { key: "footer_hashtag", label: "Hashtag (pojok kanan bawah)", placeholder: "#HypeWin" },
];

export default async function AdminFooterPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-ui-border bg-ui-bg px-6">
        <div className="text-sm text-ui-text-2">
          Admin <span className="text-ui-text-muted">/</span>{" "}
          <span className="text-ui-text-dim">Footer</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-8 py-10">
        <SettingsForm fields={FOOTER_FIELDS} initialValues={settings} title="Footer" />
      </main>
    </>
  );
}
