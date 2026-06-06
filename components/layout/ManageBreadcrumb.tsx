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
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-[#2D2D2D] bg-[#191919] px-6">
      <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
        <Link href={`/${orgSlug}`} className="hover:text-[#D4D4D4] font-medium transition">
          {orgName}
        </Link>
        <span className="text-[#6B6A68]">/</span>
        <span className="text-white font-medium">{activeLabel}</span>
      </div>
      <NotificationBell userId={userId} orgSlug={orgSlug} />
    </header>
  );
};
export { ManageBreadcrumb };
