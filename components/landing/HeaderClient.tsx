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
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#050505]/40 backdrop-blur-md transition-all duration-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex flex-col items-start leading-none gap-0.5" aria-label="Hyperion Team">
            <span className="font-orbitron text-[8px] font-extrabold uppercase tracking-[0.25em] text-[#F5C400] opacity-80">
              GAMING ON
            </span>
            <span className="font-bebas text-2xl font-black uppercase tracking-wider text-white">
              HYPERION<span className="text-[#D4FF00]">.</span>
            </span>
          </Link>

          {/* Desktop centered nav */}
          <nav
            aria-label="Main"
            className="absolute left-1/2 hidden -translate-x-1/2 md:block"
          >
            <ul className="flex items-center gap-8 font-orbitron text-[10px] font-bold uppercase tracking-[0.2em]">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href} className="relative py-1">
                    <Link
                      href={link.href}
                      className={`transition-colors duration-200 hover:text-white ${
                        active ? "text-white" : "text-white/40"
                      }`}
                    >
                      {link.label}
                    </Link>
                    {active && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute -bottom-0.5 left-0 right-0 h-px bg-[#D4FF00]"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right */}
          <div className="hidden items-center gap-5 md:flex">
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
              <div className="flex items-center gap-3">
                {authed.workspaceHref && (
                  <Link
                    href={authed.workspaceHref}
                    className="inline-flex h-9 items-center justify-center bg-[#D4FF00] hover:bg-white text-black font-bebas text-sm font-bold uppercase tracking-[0.1em] px-6 transition-colors duration-200 clip-cyber-btn"
                  >
                    Masuk ke Tim
                  </Link>
                )}
                <ProfileDropdown authed={authed} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="relative p-[1.5px] bg-white/10 hover:bg-white/30 clip-cyber-btn transition-colors duration-200"
                >
                  <span className="flex h-9 items-center justify-center bg-[#050505] px-6 font-bebas text-sm font-normal uppercase tracking-[0.1em] text-white clip-cyber-btn">
                    Login
                  </span>
                </Link>
                <Link
                  href="/rekrutmen"
                  className="inline-flex h-9 items-center justify-center bg-[#D4FF00] hover:bg-white text-black font-bebas text-sm font-bold uppercase tracking-[0.1em] px-6 transition-colors duration-200 clip-cyber-btn"
                >
                  Join Us
                </Link>
              </div>
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
            className="fixed inset-0 z-40 bg-[#0A0A0A]/80 md:hidden"
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
            className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-white/5 bg-[#0A0A0A] md:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="font-orbitron text-[8px] font-extrabold uppercase tracking-[0.25em] text-[#F5C400] opacity-80">
                  GAMING ON
                </span>
                <span className="font-bebas text-xl font-black uppercase tracking-wider text-white">
                  HYPERION<span className="text-[#D4FF00]">.</span>
                </span>
              </div>
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
              <ul className="space-y-0 font-orbitron">
                {navLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <li key={link.href} className="border-b border-white/5">
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex h-12 items-center text-xs font-semibold uppercase tracking-wider transition ${
                          active ? "text-[#D4FF00]" : "text-white/55 hover:text-white"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8 font-bebas">
                {authed ? (
                  <div className="space-y-3">
                    <p className="font-orbitron text-[9px] uppercase tracking-widest text-white/30">
                      Masuk sebagai
                    </p>
                    <p className="text-lg font-semibold text-white tracking-wide">{authed.displayName}</p>
                    {authed.workspaceHref && (
                      <Link
                        href={authed.workspaceHref}
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex h-10 w-full items-center justify-center bg-[#D4FF00] hover:bg-white text-black text-sm font-bold uppercase tracking-[0.1em] transition-colors duration-200 clip-cyber-btn"
                      >
                        Masuk ke Tim
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="relative block p-[1.5px] bg-white/10 hover:bg-white/30 clip-cyber-btn transition-colors duration-200"
                    >
                      <span className="flex h-10 items-center justify-center bg-[#0A0A0A]/95 text-sm font-normal uppercase tracking-[0.1em] text-white clip-cyber-btn">
                        Login
                      </span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex h-10 w-full items-center justify-center bg-[#D4FF00] hover:bg-white text-black text-sm font-bold uppercase tracking-[0.1em] transition-colors duration-200 clip-cyber-btn"
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            <div className="border-t border-white/5 px-5 py-4">
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
