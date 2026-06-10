"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Calendar,
  CheckSquare,
  DollarSign,
  Download,
  FileText,
  Handshake,
  Home,
  ListChecks,
  Trophy,
  Users,
  Shield,
  FolderOpen,
  Banknote,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/dashboard", Icon: Home, label: "Home" },
      { href: "/dashboard/todos", Icon: CheckSquare, label: "To-Do" },
      { href: "/dashboard/calendar", Icon: Calendar, label: "Calendar" },
      { href: "/dashboard/tournaments", Icon: Trophy, label: "Turnamen" },
    ],
  },
  {
    label: "MANAJEMEN",
    items: [
      { href: "/dashboard/managers", Icon: Shield, label: "Manager — Tim & Divisi" },
      { href: "/dashboard/users", Icon: Users, label: "User Active" },
      { href: "/dashboard/teams", Icon: Building2, label: "Tim" },
      { href: "/dashboard/files", Icon: FolderOpen, label: "File Tim" },
      { href: "/dashboard/finances", Icon: DollarSign, label: "Kas Tim" },
      { href: "/dashboard/salaries", Icon: Banknote, label: "Salary Player" },
      { href: "/dashboard/sponsors", Icon: Handshake, label: "Sponsor" },
    ],
  },
  {
    label: "KONTEN & LAPORAN",
    items: [
      { href: "/dashboard/content", Icon: FileText, label: "Konten" },
      { href: "/dashboard/reports", Icon: BarChart3, label: "Laporan" },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/dashboard/audit", Icon: ListChecks, label: "Audit Log" },
      { href: "/dashboard/export", Icon: Download, label: "Export Data" },
    ],
  },
];

interface DashboardSidebarNavProps {
  badgeCount?: number;
}

const DashboardSidebarNav = ({ badgeCount }: DashboardSidebarNavProps) => {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="sidebar-scroll flex-1 overflow-y-auto px-2 pt-4 space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B6A68]">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);
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
                    {item.href === "/dashboard/todos" && !!badgeCount && badgeCount > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
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
export { DashboardSidebarNav };
