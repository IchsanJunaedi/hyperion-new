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

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-[#070707] px-6 pb-10 pt-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/brand/logo.jpg"
                alt="Hyperion Team"
                width={44}
                height={44}
                className="h-11 w-11 rounded object-cover"
              />
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-white">
                  Hyperion<span className="text-[#F5C400]">.</span>
                </p>
                <p className="text-[10px] uppercase tracking-widest text-white/25">
                  Esports Team
                </p>
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/30">
              Empowering Young Talents to Rise and Rule. Est. 2020 — Palembang, Indonesia.
            </p>
            <Link
              href="https://www.instagram.com/hyperionteam.id/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="mt-5 inline-flex h-8 w-8 items-center justify-center border border-white/8 text-white/30 transition hover:border-[#F5C400]/40 hover:text-[#F5C400]"
            >
              <Instagram className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Empty spacer on mobile, shows on lg */}
          <div className="hidden lg:block" />

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {items.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-xs text-white/35 transition hover:text-white"
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
        <div className="mt-12 flex flex-col gap-2 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] uppercase tracking-widest text-white/20">
            © {new Date().getFullYear()} Hyperion Team. All rights reserved.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/30">
            #HypeWin
          </p>
        </div>
      </div>
    </footer>
  );
};
export { Footer };
