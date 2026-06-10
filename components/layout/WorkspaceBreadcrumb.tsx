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

const WorkspaceBreadcrumb = ({
  orgName,
  orgSlug,
  userId,
  className = "",
}: WorkspaceBreadcrumbProps) => {
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const subRoute = segments[1] ? `/${segments[1]}` : "";
  const activeLabel = ROUTE_LABELS[subRoute] ?? "Workspace";

  return (
    <header
      className={`sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ui-border bg-ui-bg px-6 ${className}`}
    >
      <div className="flex items-center gap-2 text-sm text-ui-text-2">
        <Link
          href={`/${orgSlug}`}
          className="hover:text-ui-text-dim font-medium transition"
        >
          {orgName}
        </Link>
        <span className="text-ui-text-muted">/</span>
        <span className="text-ui-text font-medium">{activeLabel}</span>
      </div>
      <NotificationBell userId={userId} orgSlug={orgSlug} />
    </header>
  );
};
export { WorkspaceBreadcrumb };
