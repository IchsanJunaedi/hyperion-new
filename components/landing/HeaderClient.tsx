"use client";

import { Instagram, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileDropdown } from "@/components/landing/ProfileDropdown";

interface HeaderProps {
  authed?: {
    displayName: string;
    workspaceHref: string | null;
  };
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/divisions", label: "Division" },
] as const;

const HeaderClient = ({ authed }: HeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#070707]/95 backdrop-blur-md">
        {/* Top utility bar */}
        <div className="flex h-8 items-center justify-end gap-3 border-b border-white/[0.04] px-4 sm:px-8">
          <Link
            href="https://www.instagram.com/hyperionteam.id/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex h-6 w-6 items-center justify-center text-white/30 transition hover:text-[#F5C400]"
          >
            <Instagram className="h-3.5 w-3.5" />
          </Link>
          <div className="h-3 w-px bg-white/10" />
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
            <span className="text-sm font-black uppercase tracking-wider text-white">
              Hyperion<span className="text-[#F5C400]">.</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-7 text-xs font-bold uppercase tracking-widest">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`transition hover:text-[#F5C400] ${
                        active ? "text-[#F5C400]" : "text-white/50"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Desktop right: Join Now (if no user) */}
          <div className="hidden md:flex items-center gap-3">
            {!authed && (
              <Link
                href="/register"
                className="inline-flex h-8 items-center bg-[#F5C400] px-4 text-[11px] font-black uppercase tracking-widest text-black transition hover:bg-yellow-300"
              >
                Join Now
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center text-white/60 transition hover:text-white md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-[#0A0A0A] border-l border-white/10 transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
          <span className="text-sm font-black uppercase tracking-wider text-white">
            Hyperion<span className="text-[#F5C400]">.</span>
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer links */}
        <nav className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex h-11 items-center text-base font-semibold transition ${
                      active
                        ? "text-[#F5C400]"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 border-t border-white/5 pt-6">
            {authed ? (
              <div className="space-y-1">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
                  Masuk sebagai
                </p>
                <p className="text-sm font-semibold text-white">{authed.displayName}</p>
                {authed.workspaceHref && (
                  <Link
                    href={authed.workspaceHref}
                    onClick={() => setMobileOpen(false)}
                    className="mt-3 flex h-10 items-center justify-center bg-[#F5C400] text-xs font-black uppercase tracking-widest text-black"
                  >
                    Masuk ke Tim
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 items-center justify-center border border-white/15 text-xs font-bold uppercase tracking-widest text-white/70 hover:border-white/30 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 items-center justify-center bg-[#F5C400] text-xs font-black uppercase tracking-widest text-black hover:bg-yellow-300"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Drawer footer */}
        <div className="border-t border-white/5 px-5 py-4">
          <Link
            href="https://www.instagram.com/hyperionteam.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white"
          >
            <Instagram className="h-3.5 w-3.5" />
            @hyperionteam.id
          </Link>
        </div>
      </div>
    </>
  );
};
export { HeaderClient };
