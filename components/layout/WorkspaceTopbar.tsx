"use client";

import Link from "next/link";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export function WorkspaceTopbar({
  organization,
  userId,
}: {
  organization: Pick<Organization, "name" | "slug" | "logo_url">;
  userId: string;
}) {
  return (
    <header className="print-hide sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-white/5 bg-background/85 px-4 backdrop-blur md:hidden">
      <Link href={`/${organization.slug}`} className="flex items-center gap-2">
        {organization.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={organization.logo_url}
            alt={organization.name}
            className="h-8 w-8 rounded-md object-cover"
          />
        ) : (
          <div className="grid h-8 w-8 place-items-center rounded-md bg-yellow-500/15 text-xs font-bold text-yellow-400">
            {organization.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="truncate text-sm font-semibold text-white">
          {organization.name}
        </span>
      </Link>
      <NotificationBell userId={userId} orgSlug={organization.slug} />
    </header>
  );
}
