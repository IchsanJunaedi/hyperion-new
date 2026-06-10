"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface ManageBreadcrumbProps {
  orgName: string;
  orgSlug: string;
  userId: string;
}

const SUB_ROUTE_LABELS: Record<string, string> = {
  "": "Overview",
  "/assign": "Tambah Member",
  "/divisions": "Edit Divisi",
  "/captains": "Edit Captain",
  "/finances": "Kas Tim",
  "/sponsors": "Sponsor",
  "/content": "Konten",
  "/development": "Player Dev",
  "/salaries": "Salary Player",
  "/reports": "Laporan",
};

function getManageLabel(pathname: string): string {
  const match = pathname.match(/^\/manage\/[^/]+(\/.*)?$/);
  if (!match) return "Manager Panel";
  const sub = match[1] ?? "";
  const topSub = sub.replace(/^(\/[^/]+).*$/, "$1");
  return SUB_ROUTE_LABELS[topSub] ?? "Manager Panel";
}

const ManageBreadcrumb = ({ orgName, orgSlug, userId }: ManageBreadcrumbProps) => {
  const pathname = usePathname();
  const activeLabel = getManageLabel(pathname ?? "");

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-ui-border bg-ui-bg px-6">
      <div className="flex items-center gap-2 text-sm text-ui-text-2">
        <Link href={`/${orgSlug}`} className="hover:text-ui-text-dim font-medium transition">
          {orgName}
        </Link>
        <span className="text-ui-text-muted">/</span>
        <span className="text-ui-text font-medium">{activeLabel}</span>
      </div>
      <NotificationBell userId={userId} orgSlug={orgSlug} />
    </header>
  );
};
export { ManageBreadcrumb };
