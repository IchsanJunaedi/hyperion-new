"use client";

import { Calendar, Home, Megaphone, Swords, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { key: "home", href: "", label: "Home", Icon: Home },
  { key: "scrim", href: "/scrim", label: "Scrim", Icon: Swords },
  { key: "roster", href: "/roster", label: "Roster", Icon: Users },
  { key: "calendar", href: "/calendar", label: "Kalender", Icon: Calendar },
  {
    key: "announcements",
    href: "/announcements",
    label: "Info",
    Icon: Megaphone,
  },
] as const;

const MobileBottomNav = ({ orgSlug }: { orgSlug: string }) => {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Workspace"
      className="print-hide fixed inset-x-0 bottom-0 z-40 border-t border-ui-border bg-ui-surface/95 backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ key, href, label, Icon }) => {
          const fullHref = `/${orgSlug}${href}`;
          const active =
            href === ""
              ? pathname === `/${orgSlug}`
              : pathname?.startsWith(fullHref) ?? false;
          return (
            <li key={key} className="flex">
              <Link
                href={fullHref}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition ${
                  active
                    ? "text-yellow-400"
                    : "text-ui-text-2 hover:text-ui-text"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
export { MobileBottomNav };
