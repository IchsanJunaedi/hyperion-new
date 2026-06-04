"use client";

import { Instagram, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { ProfileDropdown } from "@/components/landing/ProfileDropdown";

interface HeaderProps {
  authed?: {
    displayName: string;
    workspaceHref: string | null;
  };
  instagramUrl?: string;
  navLinks?: { label: string; href: string }[];
}

const HeaderClient = ({
  authed,
  instagramUrl = "https://www.instagram.com/hyperionteam.id/",
  navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Achievement", href: "/gallery" },
    { label: "Division", href: "/divisions" },
    { label: "Rekrutmen", href: "/rekrutmen" },
  ],
}: HeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-white/12 bg-[#040D1C]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" aria-label="Hyperion Team">
            <Image
              src="/brand/logo.jpg"
              alt="Hyperion Team"
              width={32}
              height={32}
              priority
              className="h-8 w-8 rounded object-cover opacity-90"
            />
            <span className="text-sm font-black uppercase tracking-wider text-white">
              Hyperion<span className="text-[#F5C400]">.</span>
            </span>
          </Link>

          {/* Desktop centered nav */}
          <nav
            aria-label="Main"
            className="absolute left-1/2 hidden -translate-x-1/2 md:block"
          >
            <ul className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href} className="relative py-1">
                    <Link
                      href={link.href}
                      className={`transition-colors duration-150 hover:text-white ${
                        active ? "text-white" : "text-white/35"
                      }`}
                    >
                      {link.label}
                    </Link>
                    {active && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute -bottom-0.5 left-0 right-0 h-px bg-[#F5C400]"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white/30 transition hover:text-white"
            >
              <Instagram className="h-4 w-4" />
            </Link>
            {authed ? (
              <ProfileDropdown authed={authed} />
            ) : (
              <Link
                href="/login"
                className="text-[11px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-white/50 transition hover:text-white md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-[#040D1C]/80 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-white/12 bg-[#040D1C] md:hidden"
          >
            <div className="flex h-14 items-center justify-between border-b border-white/12 px-5">
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

            <nav className="flex-1 overflow-y-auto px-5 py-6">
              <ul className="space-y-0">
                {navLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <li key={link.href} className="border-b border-white/12">
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex h-12 items-center text-sm font-semibold uppercase tracking-wider transition ${
                          active ? "text-[#F5C400]" : "text-white/50 hover:text-white"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8">
                {authed ? (
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/30">
                      Masuk sebagai
                    </p>
                    <p className="text-sm font-semibold text-white">{authed.displayName}</p>
                    {authed.workspaceHref && (
                      <Link
                        href={authed.workspaceHref}
                        onClick={() => setMobileOpen(false)}
                        className="flex h-10 items-center justify-center border border-[#F5C400] text-xs font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
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
                      className="flex h-10 items-center justify-center border border-white/15 text-xs font-bold uppercase tracking-widest text-white/60 transition hover:border-white/40 hover:text-white"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex h-10 items-center justify-center bg-[#F5C400] text-xs font-black uppercase tracking-widest text-black transition hover:bg-yellow-300"
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            <div className="border-t border-white/12 px-5 py-4">
              <Link
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-white/30 transition hover:text-white"
              >
                <Instagram className="h-3.5 w-3.5" />
                @hyperionteam.id
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
export { HeaderClient };
