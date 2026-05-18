"use client";

import {
  BarChart3,
  Calendar,
  CalendarClock,
  ChevronDown,
  DollarSign,
  FolderOpen,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Megaphone,
  Settings,
  Shield,
  Swords,
  Tags,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SettingsModal } from "@/features/settings/components/SettingsModal";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

interface SidebarDivision {
  id: string;
  name: string;
}

export interface WorkspaceSidebarProps {
  orgSlug: string;
  orgId: string;
  orgName: string;
  orgLogoUrl: string | null;
  divisions: SidebarDivision[];
  user: {
    displayName: string;
    avatarUrl: string | null;
    userId: string;
    email?: string;
    role?: string;
  };
}

interface NavItem {
  key: string;
  /** Relative path appended to orgSlug, OR absolute path if absoluteHref is set */
  href: string;
  /** If set, used as-is for link href and active matching (for /manage/* routes) */
  absoluteHref?: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** Use exact match for active check (default: startsWith) */
  exactMatch?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Manager panel group — absolute hrefs, shown only for manager/owner */
const MANAGER_NAV_GROUP: NavGroup = {
  label: "MANAGER PANEL",
  items: [
    {
      key: "manage-overview",
      href: "",
      absoluteHref: "/manage",
      label: "Overview",
      Icon: LayoutDashboard,
      exactMatch: true,
    },
    {
      key: "manage-assign",
      href: "",
      absoluteHref: "/manage/assign",
      label: "Tambah Member",
      Icon: UserPlus,
    },
    {
      key: "manage-divisions",
      href: "",
      absoluteHref: "/manage/divisions",
      label: "Edit Divisi",
      Icon: Tags,
    },
    {
      key: "manage-captains",
      href: "",
      absoluteHref: "/manage/captains",
      label: "Edit Captain",
      Icon: Shield,
    },
    {
      key: "manage-finances",
      href: "",
      absoluteHref: "/manage/finances",
      label: "Kas Tim",
      Icon: DollarSign,
    },
    {
      key: "manage-content",
      href: "",
      absoluteHref: "/manage/content",
      label: "Konten",
      Icon: CalendarClock,
    },
    {
      key: "manage-development",
      href: "",
      absoluteHref: "/manage/development",
      label: "Player Dev",
      Icon: TrendingUp,
    },
    {
      key: "manage-reports",
      href: "",
      absoluteHref: "/manage/reports",
      label: "Laporan",
      Icon: BarChart3,
    },
  ],
};

/** Workspace groups — relative hrefs prefixed with orgSlug */
const WORKSPACE_NAV_GROUPS: NavGroup[] = [
  {
    label: "HOME",
    items: [
      { key: "home", href: "", label: "Home", Icon: Home, exactMatch: true },
      { key: "calendar", href: "/calendar", label: "Calendar", Icon: Calendar },
    ],
  },
  {
    label: "KOMPETISI",
    items: [
      { key: "scrim", href: "/scrim", label: "Scrim", Icon: Swords },
      {
        key: "tournaments",
        href: "/tournaments",
        label: "Turnamen",
        Icon: Trophy,
      },
    ],
  },
  {
    label: "TIM",
    items: [
      { key: "roster", href: "/roster", label: "Roster", Icon: Users },
      { key: "polls", href: "/polls", label: "Polling", Icon: BarChart3 },
    ],
  },
  {
    label: "KONTEN",
    items: [
      {
        key: "strategy",
        href: "/strategy",
        label: "Strategy",
        Icon: Lightbulb,
      },
      {
        key: "announcements",
        href: "/announcements",
        label: "Pengumuman",
        Icon: Megaphone,
      },
      { key: "files", href: "/files", label: "Files", Icon: FolderOpen },
    ],
  },
];

const ROLE_BADGE: Record<string, string> = {
  owner: "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]",
  manager: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]",
  coach: "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]",
  captain: "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]",
};

export function WorkspaceSidebar({
  orgSlug,
  orgId,
  orgName,
  orgLogoUrl,
  divisions,
  user,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const activeDivisionId = useWorkspaceStore((s) => s.activeDivisionId);
  const setActiveDivision = useWorkspaceStore((s) => s.setActiveDivision);
  const [divisionOpen, setDivisionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const isManager = user.role === "manager" || user.role === "owner";

  /** Resolve full href for a nav item */
  const getHref = (item: NavItem) =>
    item.absoluteHref ?? `/${orgSlug}${item.href}`;

  /** Check if a nav item is currently active */
  const isActive = (item: NavItem) => {
    const full = getHref(item);
    if (item.exactMatch || item.href === "") {
      return pathname === full;
    }
    return pathname?.startsWith(full) ?? false;
  };

  const hasFilesAccess =
    user.role === "owner" || user.role === "manager" || user.role === "coach";

  const allGroups: NavGroup[] = (isManager
    ? [MANAGER_NAV_GROUP, ...WORKSPACE_NAV_GROUPS]
    : WORKSPACE_NAV_GROUPS)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.key === "files") return hasFilesAccess;
        return true;
      }),
    }));

  return (
    <aside className="hidden md:flex md:w-[280px] md:flex-col md:border-r md:border-[#2D2D2D] md:bg-[#202020] h-screen sticky top-0">
      {/* Org header */}
      <Link
        href={`/${orgSlug}`}
        className="flex h-12 shrink-0 items-center gap-3 border-b border-[#2D2D2D] px-4 transition hover:bg-[#2C2C2C]"
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
        {user.role && (
          <span
            className={`shrink-0 text-[10px] font-bold uppercase tracking-widest ${ROLE_BADGE[user.role] ?? "text-white/50"}`}
          >
            {user.role}
          </span>
        )}
      </Link>

      {/* Division switcher */}
      {divisions.length > 1 && (
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
          {divisionOpen && (
            <ul className="mt-1 max-h-60 overflow-auto rounded border border-[#2D2D2D] bg-[#202020] p-1 text-sm">
              {divisions.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDivision(d.id);
                      setDivisionOpen(false);
                    }}
                    className={`block w-full truncate rounded px-3 py-1.5 text-left transition hover:bg-[#2C2C2C] ${
                      d.id === activeDivision?.id
                        ? "bg-[#2C2C2C] text-[#D4D4D4]"
                        : "text-[#9B9A97]"
                    }`}
                  >
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Nav groups */}
      <nav
        aria-label="Workspace"
        className="sidebar-scroll flex-1 overflow-y-auto px-2 pt-4 space-y-5"
      >
        {allGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B6A68]">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.key}>
                    <Link
                      href={getHref(item)}
                      className={`flex items-center gap-3 rounded px-3 py-1.5 text-sm transition ${
                        active
                          ? "bg-[#2C2C2C] font-medium text-[#D4D4D4]"
                          : "text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
                      }`}
                    >
                      <item.Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Settings — separated */}
      <div className="border-t border-[#2D2D2D] px-2 py-3">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-1.5 text-sm text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          Settings
        </button>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userId={user.userId}
        orgId={orgId}
        role={user.role ?? "member"}
      />

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
          <p className="min-w-0 flex-1 truncate text-xs text-[#9B9A97]">
            {user.email ?? user.displayName}
          </p>
        </div>
      </div>
    </aside>
  );
}
