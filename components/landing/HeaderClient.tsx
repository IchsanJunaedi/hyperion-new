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
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/divisions", label: "Division" },
] as const;

const HeaderClient = ({ authed }: HeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 z-50 w-full transition-all duration-500"
        style={{
          background: scrolled ? "rgba(5,5,5,0.9)" : "rgba(5,5,5,0.18)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(255,255,255,0.02)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" aria-label="Hyperion Team">
            <Image
              src="/brand/logo.jpg"
              alt="Hyperion Team"
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-lg object-cover"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}
            />
            <span className="text-sm font-black uppercase tracking-wider text-white">
              Hyperion<span className="text-[#F5C400]">.</span>
            </span>
          </Link>

          {/* Centered desktop nav */}
          <nav
            aria-label="Main"
            className="absolute left-1/2 hidden -translate-x-1/2 md:block"
          >
            <ul className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest">
              {NAV_LINKS.map((link) => {
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
                        className="absolute -bottom-0.5 left-0 right-0 h-px bg-[#F5C400]"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right side */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="https://www.instagram.com/hyperionteam.id/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/8 text-white/30 transition hover:border-white/20 hover:text-white/80"
            >
              <Instagram className="h-3.5 w-3.5" />
            </Link>
            {authed ? (
              <ProfileDropdown authed={authed} />
            ) : (
              <Link
                href="/login"
                className="inline-flex h-8 items-center rounded-full px-5 text-[11px] font-bold uppercase tracking-widest transition-all duration-200 hover:bg-[#F5C400]/10"
                style={{
                  background: "rgba(245,196,0,0.06)",
                  border: "1px solid rgba(245,196,0,0.22)",
                  color: "#F5C400",
                }}
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
            className="flex h-9 w-9 cursor-pointer items-center justify-center text-white/60 transition hover:text-white md:hidden"
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
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
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-white/8 md:hidden"
            style={{
              background: "rgba(8,8,8,0.97)",
              backdropFilter: "blur(32px)",
            }}
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
                          active ? "text-[#F5C400]" : "text-white/60 hover:text-white"
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
export { HeaderClient };
