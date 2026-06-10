import { getSiteSettings, getAboutAlumni } from "@/features/admin/queries";
import { AboutAdminClient } from "@/features/admin/components/AboutAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const [settings, alumni] = await Promise.all([getSiteSettings(), getAboutAlumni()]);
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-ui-border bg-ui-bg px-6">
        <div className="text-sm text-ui-text-2">
          Admin <span className="text-ui-text-muted">/</span>{" "}
          <span className="text-ui-text-dim">About</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 sm:px-8 py-10">
        <AboutAdminClient initialSettings={settings} initialAlumni={alumni} />
      </main>
    </>
  );
}
