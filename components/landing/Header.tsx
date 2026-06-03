import { createClient } from "@/lib/supabase/server";
import type { AppMetadataWithOrgs } from "@/types/jwt";
import { HeaderClient } from "./HeaderClient";
import { getSiteSettings } from "@/features/admin/queries";

const DEFAULT_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Achievement", href: "/gallery" },
  { label: "Division", href: "/divisions" },
  { label: "Rekrutmen", href: "/rekrutmen" },
];

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let authed: { displayName: string; workspaceHref: string | null } | undefined;
  if (user) {
    const orgs =
      (user.app_metadata as AppMetadataWithOrgs | undefined)?.organizations ?? [];
    const firstOrg = orgs[0];
    authed = {
      displayName:
        (user.user_metadata?.["display_name"] as string | undefined) ??
        user.email ??
        "Akun saya",
      workspaceHref: firstOrg ? `/${firstOrg.slug}` : null,
    };
  }

  const settings = await getSiteSettings();
  const instagramUrl = settings.contact_instagram_url || "https://www.instagram.com/hyperionteam.id/";

  let navLinks = DEFAULT_NAV;
  if (settings.nav_links_json) {
    try { navLinks = JSON.parse(settings.nav_links_json); } catch { /* keep default */ }
  }

  return <HeaderClient authed={authed} instagramUrl={instagramUrl} navLinks={navLinks} />;
}
