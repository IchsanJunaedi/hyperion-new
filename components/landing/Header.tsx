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
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#070707]/90 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="flex h-8 items-center justify-end gap-2 border-b border-white/[0.04] px-4 sm:px-8">
        <Link
          href="https://www.instagram.com/hyperionteam.id/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="inline-flex h-6 w-6 items-center justify-center text-white/30 transition hover:text-[#F5C400]"
        >
          <Instagram className="h-3.5 w-3.5" />
        </Link>
        <ProfileDropdown authed={authed} />
      </div>

      {/* Main nav */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-8">
        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="Hyperion Team">
          <Image
            src="/brand/logo.jpg"
            alt="Hyperion Team"
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded object-cover"
          />
          <span className="hidden text-sm font-black uppercase tracking-wider text-white sm:block">
            Hyperion<span className="text-[#F5C400]">.</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-white/45 transition hover:text-[#F5C400]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Auth CTA */}
        {!user && (
          <Link
            href="/register"
            className="hidden h-8 items-center bg-[#F5C400] px-4 text-[11px] font-black uppercase tracking-widest text-black transition hover:bg-yellow-300 sm:inline-flex"
          >
            Join Now
          </Link>
        )}
        {user && (
          <div className="hidden sm:block">
            <ProfileDropdown authed={authed} />
          </div>
        )}
      </div>
    </header>
  );
}
