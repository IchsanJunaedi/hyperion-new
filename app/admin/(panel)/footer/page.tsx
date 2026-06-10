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
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Footer</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-8 py-10">
        <SettingsForm fields={FOOTER_FIELDS} initialValues={settings} title="Footer" />
      </main>
    </>
  );
}
