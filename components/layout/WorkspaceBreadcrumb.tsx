"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface WorkspaceBreadcrumbProps {
  orgName: string;
  orgSlug: string;
  userId: string;
  className?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  "": "Home",
  "/calendar": "Calendar",
  "/scrim": "Scrim",
  "/tournaments": "Turnamen",
  "/roster": "Roster",
  "/polls": "Polling",
  "/strategy": "Strategy",
  "/announcements": "Pengumuman",
  "/files": "Files",
  "/settings": "Settings",
};

export function WorkspaceBreadcrumb({
  orgName,
  orgSlug,
  userId,
  className = "",
}: WorkspaceBreadcrumbProps) {
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const subRoute = segments[1] ? `/${segments[1]}` : "";
  const activeLabel = ROUTE_LABELS[subRoute] ?? "Workspace";

  return (
    <header
      className={`sticky top-0 z-30 flex h-12 items-center justify-between border-b border-[#2D2D2D] bg-[#191919] px-6 ${className}`}
    >
      <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
        <Link
          href={`/${orgSlug}`}
          className="hover:text-[#D4D4D4] font-medium transition"
        >
          {orgName}
        </Link>
        <span className="text-[#6B6A68]">/</span>
        <span className="text-white font-medium">{activeLabel}</span>
      </div>
      <div className="flex items-center">
        <NotificationBell userId={userId} orgSlug={orgSlug} />
      </div>
    </header>
  );
}
