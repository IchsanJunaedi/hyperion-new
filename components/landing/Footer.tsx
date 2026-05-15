import { Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
];
const COMPANY_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/gallery", label: "Gallery" },
];
const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/contact", label: "Contact Us" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 pb-10 pt-16 text-sm text-white/55 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)_1fr]">
        <div className="flex items-start gap-3">
          <Image
            src="/brand/logo.jpg"
            alt="Hyperion Team"
            width={48}
            height={48}
            className="h-12 w-12 rounded-md object-cover"
          />
          <Link href="/" className="text-base font-semibold leading-tight text-white">
            Hyperion
            <br />
            Team
          </Link>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Products</h3>
          <ul className="space-y-2">
            {PRODUCT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Company</h3>
          <ul className="space-y-2">
            {COMPANY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">
            Legal &amp; Contact
          </h3>
          <ul className="space-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">
            Connect with us
          </h3>
          <Link
            href="https://www.instagram.com/hyperionteam.id/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 transition hover:bg-white/5 hover:text-white"
          >
            <Instagram className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-white/5 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Hyperion Team. All rights reserved.
        </p>
        <ul className="flex gap-6">
          <li>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
