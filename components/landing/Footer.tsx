import { Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const LINKS = {
  Team: [
    { href: "/about", label: "About Us" },
    { href: "/gallery", label: "Gallery" },
    { href: "/divisions", label: "Divisions" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/contact", label: "Contact Us" },
  ],
};

interface FooterSettings {
  footer_tagline: string;
  footer_instagram_handle: string;
  footer_instagram_url: string;
  footer_hashtag: string;
}

const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  footer_tagline: "Empowering Young Talents to Rise and Rule. Est. 2020 — Palembang, Indonesia.",
  footer_instagram_handle: "@hyperionteam.id",
  footer_instagram_url: "https://www.instagram.com/hyperionteam.id/",
  footer_hashtag: "#HypeWin",
};

interface FooterProps {
  settings?: FooterSettings;
}

const Footer = ({ settings = DEFAULT_FOOTER_SETTINGS }: FooterProps) => {
  return (
    <footer className="relative overflow-hidden border-t border-[#F5C400]/10 bg-black px-5 pb-10 pt-16 sm:px-8 lg:px-10">
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="Hyperion Team">
              <Image
                src="/brand/logo.jpg"
                alt="Hyperion Team"
                width={36}
                height={36}
                className="h-9 w-9 rounded object-cover opacity-90"
              />
              <span className="text-sm font-black uppercase tracking-wider text-white">
                Hyperion<span className="text-[#F5C400]">.</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/45">
              {settings.footer_tagline}
            </p>
            <Link
              href={settings.footer_instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="mt-5 inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"
            >
              <Instagram className="h-3.5 w-3.5" />
              {settings.footer_instagram_handle}
            </Link>
          </div>

          {/* Spacer on large screens */}
          <div className="hidden lg:block" />

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/45">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {items.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-xs text-white/45 transition hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-2 border-t border-[#F5C400]/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] uppercase tracking-widest text-white/38">
            © {new Date().getFullYear()} Hyperion Team. All rights reserved.
          </p>
          <p
            className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/70"
            style={{ textShadow: "0 0 12px rgba(245,196,0,0.35)" }}
          >
            {settings.footer_hashtag}
          </p>
        </div>
      </div>
    </footer>
  );
};
export { Footer };
