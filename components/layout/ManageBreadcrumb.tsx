"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface ManageBreadcrumbProps {
  orgName: string;
  orgSlug: string;
  userId: string;
}

const ROUTE_LABELS: Record<string, string> = {
  "/manage": "Overview",
  "/manage/assign": "Tambah Member",
  "/manage/divisions": "Edit Divisi",
  "/manage/captains": "Edit Captain",
  "/manage/finances": "Kas Tim",
  "/manage/content": "Konten",
  "/manage/development": "Player Dev",
  "/manage/reports": "Laporan",
};

const ManageBreadcrumb = ({ orgName, orgSlug, userId }: ManageBreadcrumbProps) => {
  const pathname = usePathname();
  const activeLabel = ROUTE_LABELS[pathname ?? ""] ?? "Manager Panel";

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
