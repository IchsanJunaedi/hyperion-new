"use client";

import {
  Calendar,
  ChevronDown,
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
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-white/5 md:bg-zinc-950">
      {/* Org header */}
      <Link
        href={`/${orgSlug}`}
        className="flex items-center gap-3 border-b border-white/5 px-4 py-4 transition hover:bg-white/[0.02]"
      >
        {orgLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={orgLogoUrl}
            alt={orgName}
            className="h-9 w-9 rounded-md object-cover"
          />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-md bg-yellow-500/15 text-sm font-bold text-yellow-400">
            {orgName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {orgName}
          </p>
          <p className="truncate text-xs text-white/55">{orgSlug}</p>
        </div>
      </Link>

      {/* Division switcher */}
      {divisions.length > 0 ? (
        <div className="px-3 pt-3">
          <button
            type="button"
            aria-expanded={divisionOpen}
            onClick={() => setDivisionOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-md border border-white/5 bg-zinc-900 px-3 py-2 text-left text-sm text-white/85 transition hover:bg-zinc-800"
          >
            <span className="truncate">
              {activeDivision?.name ?? "Pilih divisi"}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition ${divisionOpen ? "rotate-180" : ""}`}
            />
          </button>
          {divisionOpen ? (
            <ul className="mt-1 max-h-60 overflow-auto rounded-md border border-white/5 bg-zinc-900 p-1 text-sm">
              {divisions.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDivision(d.id);
                      setDivisionOpen(false);
                    }}
                    className={`block w-full truncate rounded-md px-3 py-1.5 text-left transition hover:bg-white/10 ${d.id === activeDivision?.id ? "text-yellow-400" : "text-white/85"}`}
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
      <nav aria-label="Workspace" className="flex-1 px-3 pt-4">
        <ul className="space-y-1">
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
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/5 px-3 py-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <p className="min-w-0 flex-1 truncate text-sm text-white/90">
            {user.displayName}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Logout"
              className="rounded-md p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
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
