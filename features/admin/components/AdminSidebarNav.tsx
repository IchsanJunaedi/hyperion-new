"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Image,
  Users,
  MessageSquare,
  Grid3x3,
  Layers,
  UserCircle,
  Heart,
  LayoutTemplate,
  Trophy,
  CalendarRange,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "KONTEN LIST",
    items: [
      { href: "/admin/gallery", Icon: Image, label: "Gallery & Achievement" },
      { href: "/admin/achievements", Icon: Trophy, label: "Achievements" },
      { href: "/admin/tournaments", Icon: CalendarRange, label: "Tournaments" },
      { href: "/admin/partners", Icon: Layers, label: "Partners" },
      { href: "/admin/testimonials", Icon: MessageSquare, label: "Testimonials" },
      { href: "/admin/divisions", Icon: Grid3x3, label: "Divisions" },
    ],
  },
  {
    label: "SECTIONS TEKS",
    items: [
      { href: "/admin/hero", Icon: LayoutTemplate, label: "Hero" },
      { href: "/admin/join", Icon: Heart, label: "Join Section" },
      { href: "/admin/footer", Icon: UserCircle, label: "Footer" },
    ],
  },
];

const AdminSidebarNav = () => {
  const pathname = usePathname();

  return (
    <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 pt-4 space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B6A68]">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded px-3 py-1.5 text-sm transition ${
                      active
                        ? "bg-[#2C2C2C] font-medium text-[#D4D4D4]"
                        : "text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
                    }`}
                  >
                    <item.Icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};
export { AdminSidebarNav };
