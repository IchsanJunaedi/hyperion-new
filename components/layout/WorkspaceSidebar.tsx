"use client";

import {
  Calendar,
  ChevronDown,
  FolderOpen,
  Home,
  Lightbulb,
  LogOut,
  Megaphone,
  Settings,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { logoutAction } from "@/lib/actions/auth";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

interface SidebarDivision {
  id: string;
  name: string;
}

export interface WorkspaceSidebarProps {
  orgSlug: string;
  orgName: string;
  orgLogoUrl: string | null;
  divisions: SidebarDivision[];
  user: {
    displayName: string;
    avatarUrl: string | null;
    userId: string;
  };
}

const NAV_ITEMS = [
  { key: "home", href: "", label: "Home", Icon: Home },
  { key: "scrim", href: "/scrim", label: "Scrim", Icon: Swords },
  { key: "roster", href: "/roster", label: "Roster", Icon: Users },
  { key: "calendar", href: "/calendar", label: "Calendar", Icon: Calendar },
  { key: "strategy", href: "/strategy", label: "Strategy", Icon: Lightbulb },
  {
    key: "announcements",
    href: "/announcements",
    label: "Pengumuman",
    Icon: Megaphone,
  },
  {
    key: "files",
    href: "/files",
    label: "Files",
    Icon: FolderOpen,
  },
  {
    key: "tournaments",
    href: "/tournaments",
    label: "Turnamen",
    Icon: Trophy,
  },
  { key: "settings", href: "/settings", label: "Settings", Icon: Settings },
] as const;

export function WorkspaceSidebar({
  orgSlug,
  orgName,
  orgLogoUrl,
  divisions,
  user,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const activeDivisionId = useWorkspaceStore((s) => s.activeDivisionId);
  const setActiveDivision = useWorkspaceStore((s) => s.setActiveDivision);
  const [divisionOpen, setDivisionOpen] = useState(false);

  // Keep the persisted activeDivisionId in sync with the visible
  // selection. If it's null (initial state or post-org-switch) or
  // points at a division not in the current list, set it to the first
  // division so downstream consumers (scrim/roster filters, etc.) read
  // the same value the UI shows as active.
  useEffect(() => {
    if (
      !activeDivisionId ||
      !divisions.some((d) => d.id === activeDivisionId)
    ) {
      setActiveDivision(divisions[0]?.id ?? null);
    }
  }, [activeDivisionId, divisions, setActiveDivision]);

  const activeDivision =
    divisions.find((d) => d.id === activeDivisionId) ?? divisions[0] ?? null;

  return (
    <aside className="hidden md:flex md:w-[280px] md:flex-col md:border-r md:border-[#2D2D2D] md:bg-[#202020] h-screen sticky top-0">
      {/* Org header */}
      <Link
        href={`/${orgSlug}`}
        className="flex items-center gap-3 border-b border-[#2D2D2D] px-4 py-4 transition hover:bg-[#2C2C2C]"
      >
        {orgLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={orgLogoUrl}
            alt={orgName}
            className="h-5 w-5 rounded object-cover"
          />
        ) : (
          <div className="grid h-5 w-5 place-items-center rounded bg-[#353434] text-xs font-semibold text-[#E5E2E1]">
            {orgName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#D4D4D4]">
            {orgName}
          </p>
        </div>
      </Link>

      {/* Division switcher */}
      {divisions.length > 0 ? (
        <div className="px-3 pt-3">
          <button
            type="button"
            aria-expanded={divisionOpen}
            onClick={() => setDivisionOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-[#9B9A97] transition hover:bg-[#2C2C2C]"
          >
            <span className="truncate">
              {activeDivision?.name ?? "Pilih divisi"}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition ${divisionOpen ? "rotate-180" : ""}`}
            />
          </button>
          {divisionOpen ? (
            <ul className="mt-1 max-h-60 overflow-auto rounded border border-[#2D2D2D] bg-[#202020] p-1 text-sm">
              {divisions.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDivision(d.id);
                      setDivisionOpen(false);
                    }}
                    className={`block w-full truncate rounded px-3 py-1.5 text-left transition hover:bg-[#2C2C2C] ${d.id === activeDivision?.id ? "text-[#D4D4D4] bg-[#2C2C2C]" : "text-[#9B9A97]"}`}
                  >
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/* Nav items */}
      <nav aria-label="Workspace" className="flex-1 px-2 pt-4 overflow-y-auto">
        <div className="px-3 py-1 text-xs font-semibold text-[#6B6A68] mb-1">
          Workspace
        </div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ key, href, label, Icon }) => {
            const fullHref = `/${orgSlug}${href}`;
            const active =
              href === ""
                ? pathname === `/${orgSlug}`
                : pathname?.startsWith(fullHref) ?? false;
            return (
              <li key={key}>
                <Link
                  href={fullHref}
                  className={`flex items-center gap-3 rounded px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-[#2C2C2C] text-[#D4D4D4] font-medium"
                      : "text-[#9B9A97] hover:bg-[#2C2C2C]"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Notification bell */}
      <div className="px-3 pb-2">
        <NotificationBell userId={user.userId} orgSlug={orgSlug} />
      </div>

      {/* User footer */}
      <div className="border-t border-[#2D2D2D] px-3 py-3">
        <div className="flex items-center gap-3 rounded px-2 py-2">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={32}
              height={32}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-5 w-5 place-items-center rounded-full bg-[#353434] text-[10px] font-semibold text-[#D4D4D4]">
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <p className="min-w-0 flex-1 truncate text-sm text-[#9B9A97]">
            {user.displayName}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Logout"
              className="rounded p-1.5 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
