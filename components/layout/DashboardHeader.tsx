"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface DashboardHeaderProps {
  workspaceName: string;
  userId: string;
  orgSlug: string;
}

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/assign": "Assign Role",
  "/dashboard/audit": "Audit Log",
  "/dashboard/calendar": "Kalender",
  "/dashboard/content": "Konten",
  "/dashboard/divisions": "Edit Divisi",
  "/dashboard/export": "Export Data",
  "/dashboard/files": "File Tim",
  "/dashboard/finances": "Kas Tim",
  "/dashboard/managers": "Manager",
  "/dashboard/reports": "Laporan",
  "/dashboard/salaries": "Gaji Player",
  "/dashboard/sponsors": "Sponsor",
  "/dashboard/teams": "Pengaturan Tim",
  "/dashboard/tournaments": "Turnamen",
  "/dashboard/todos": "To-Do",
  "/dashboard/users": "User Active",
};

const DashboardHeader = ({
  workspaceName,
  userId,
  orgSlug,
}: DashboardHeaderProps) => {
  const pathname = usePathname() ?? "/dashboard";
  const segments = pathname.split("/").filter(Boolean);

  const renderBreadcrumbs = () => {
    // Case 1: Root Dashboard (/dashboard)
    if (segments.length <= 1) {
      return (
        <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
          <span>{workspaceName}</span>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4] font-medium">Home</span>
        </div>
      );
    }

    // Case 2: Sub-routes (e.g. /dashboard/users)
    if (segments.length === 2) {
      const activeLabel = ROUTE_LABELS[pathname] ?? segments[1];
      return (
        <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
          <Link href="/dashboard" className="hover:text-[#D4D4D4] font-medium transition">
            Home
          </Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4] font-medium">{activeLabel}</span>
        </div>
      );
    }

    // Case 3: Nested sub-routes (e.g. /dashboard/sponsors/[id])
    if (segments.length >= 3) {
      const parentPath = `/${segments[0]}/${segments[1]}`;
      const parentLabel = ROUTE_LABELS[parentPath] ?? segments[1];
      return (
        <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
          <Link href="/dashboard" className="hover:text-[#D4D4D4] font-medium transition">
            Home
          </Link>
          <span className="text-[#6B6A68]">/</span>
          <Link href={parentPath} className="hover:text-[#D4D4D4] font-medium transition">
            {parentLabel}
          </Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4] font-medium truncate max-w-[200px]">
            Detail
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <header className="sticky top-0 z-40 h-12 border-b border-[#2D2D2D] bg-[#191919] select-none print-hide">
      <div className="w-full h-full flex items-center justify-between px-6">
        {renderBreadcrumbs()}
        <NotificationBell userId={userId} orgSlug={orgSlug} />
      </div>
    </header>
  );
};

export { DashboardHeader };
