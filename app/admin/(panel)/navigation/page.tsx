import { getSiteSettings } from "@/features/admin/queries";
import { NavAdminClient } from "@/features/admin/components/NavAdminClient";

export const dynamic = "force-dynamic";

const DEFAULT_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Achievement", href: "/gallery" },
  { label: "Division", href: "/divisions" },
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
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Navigation</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-8 py-10">
        <NavAdminClient initialLinks={links} />
      </main>
    </>
  );
}
