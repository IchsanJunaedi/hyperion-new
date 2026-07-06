import { getSiteSettings } from "@/features/admin/queries";
import { NavAdminClient } from "@/features/admin/components/NavAdminClient";

export const dynamic = "force-dynamic";

const DEFAULT_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Achievement", href: "/gallery" },
  { label: "Division", href: "/divisions" },
  { label: "News", href: "/news" },
  { label: "Schedule", href: "/schedule" },
  { label: "Sponsors", href: "/sponsors" },
  { label: "Rekrutmen", href: "/rekrutmen" },
];

export default async function AdminNavigationPage() {
  const settings = await getSiteSettings();
  let links = DEFAULT_NAV;
  if (settings.nav_links_json) {
    try { links = JSON.parse(settings.nav_links_json); } catch { /* keep default */ }
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-ui-border bg-ui-bg px-6">
        <div className="text-sm text-ui-text-2">
          Admin <span className="text-ui-text-muted">/</span>{" "}
          <span className="text-ui-text-dim">Navigation</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-8 py-10">
        <NavAdminClient initialLinks={links} />
      </main>
    </>
  );
}
