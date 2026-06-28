"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { useUiStore } from "@/stores/useUiStore";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

const WorkspaceTopbar = ({
  organization,
  userId,
}: {
  organization: Pick<Organization, "name" | "slug" | "logo_url">;
  userId: string;
}) => {
  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);

  return (
    <header className="print-hide sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-ui-border bg-background/85 px-4 backdrop-blur md:hidden">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          aria-label="Buka menu"
          onClick={toggleMobileSidebar}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href={`/${organization.slug}`} className="flex items-center gap-2 min-w-0">
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
          <span className="truncate text-sm font-semibold text-ui-text">
            {organization.name}
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-1.5">
        <ThemeToggle variant="icon" />
        <NotificationBell userId={userId} orgSlug={organization.slug} />
      </div>
    </header>
  );
};
export { WorkspaceTopbar };

