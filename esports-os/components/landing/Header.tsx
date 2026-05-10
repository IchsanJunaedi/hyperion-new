import { Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProfileDropdown } from "@/components/landing/ProfileDropdown";
import { createClient } from "@/lib/supabase/server";
import type { AppMetadataWithOrgs } from "@/types/jwt";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/divisions", label: "Division" },
] as const;

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let authed: { displayName: string; workspaceHref: string | null } | undefined;
  if (user) {
    const orgs =
      (user.app_metadata as AppMetadataWithOrgs | undefined)?.organizations ??
      [];
    const firstOrg = orgs[0];
    authed = {
      displayName:
        (user.user_metadata?.["display_name"] as string | undefined) ??
        user.email ??
        "Akun saya",
      workspaceHref: firstOrg ? `/${firstOrg.slug}` : null,
    };
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/85 backdrop-blur">
      {/* Thin top utility bar (Instagram + profile icon) */}
      <div className="flex h-9 items-center justify-end gap-2 px-4 text-white/70 sm:px-8">
        <Link
          href="https://www.instagram.com/hyperionteam.id/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/5 hover:text-white"
        >
          <Instagram className="h-4 w-4" />
        </Link>
        <ProfileDropdown authed={authed} />
      </div>

      {/* Main nav row */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Hyperion Team">
          <Image
            src="/brand/logo.jpg"
            alt="Hyperion Team"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-md object-cover"
          />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium text-white/85">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
