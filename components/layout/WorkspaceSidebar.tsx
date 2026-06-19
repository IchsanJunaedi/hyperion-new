"use client";

import {
  Activity,
  Banknote,
  BarChart3,
  Calendar,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FolderOpen,
  Handshake,
  Home,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  Radar,
  Settings,
  Swords,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SettingsModal } from "@/features/settings/components/SettingsModal";
import { TodoBadge } from "@/features/todos/components/TodoBadge";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { TeamSwitcher } from "@/components/layout/TeamSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface SidebarDivision {
  id: string;
  name: string;
}

interface ManagedTeam {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
}

export interface WorkspaceSidebarProps {
  orgSlug: string;
  orgId: string;
  orgName: string;
  orgLogoUrl: string | null;
  divisions: SidebarDivision[];
  managedTeams?: ManagedTeam[];
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

/** Manager panel group — absolute hrefs scoped to orgSlug, shown only for manager/owner */
const getManagerNavGroup = (orgSlug: string): NavGroup => ({
  label: "MANAGER PANEL",
  items: [
    {
      key: "manage-overview",
      href: "",
      absoluteHref: `/manage/${orgSlug}`,
      label: "Overview",
      Icon: LayoutDashboard,
      exactMatch: true,
    },
    {
      key: "manage-calendar",
      href: "",
      absoluteHref: "/manage/calendar",
      label: "Kalender Semua Tim",
      Icon: Calendar,
    },
    {
      key: "manage-assign",
      href: "",
      absoluteHref: `/manage/${orgSlug}/assign`,
      label: "Tambah Member",
      Icon: UserPlus,
    },
    {
      key: "manage-finances",
      href: "",
      absoluteHref: `/manage/${orgSlug}/finances`,
      label: "Kas Tim",
      Icon: DollarSign,
    },
    {
      key: "manage-sponsors",
      href: "",
      absoluteHref: `/manage/${orgSlug}/sponsors`,
      label: "Sponsor",
      Icon: Handshake,
    },
    {
      key: "manage-content",
      href: "",
      absoluteHref: `/manage/${orgSlug}/content`,
      label: "Konten",
      Icon: CalendarClock,
    },
    {
      key: "manage-development",
      href: "",
      absoluteHref: `/manage/${orgSlug}/development`,
      label: "Player Dev",
      Icon: TrendingUp,
    },
    {
      key: "manage-salaries",
      href: "",
      absoluteHref: `/manage/${orgSlug}/salaries`,
      label: "Salary Player",
      Icon: Banknote,
    },
    {
      key: "manage-reports",
      href: "",
      absoluteHref: `/manage/${orgSlug}/reports`,
      label: "Laporan",
      Icon: BarChart3,
    },
    {
      key: "manage-todos",
      href: "",
      absoluteHref: `/manage/${orgSlug}/todos`,
      label: "To-Do",
      Icon: ClipboardCheck,
    },
  ],
});

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
      {
        key: "scouting",
        href: "/scouting",
        label: "Scouting",
        Icon: Radar,
      },
      {
        key: "analytics",
        href: "/analytics",
        label: "Analytics",
        Icon: Activity,
      },
      { key: "meta", href: "/meta", label: "Meta", Icon: Zap },
      {
        key: "trials",
        href: "/trials",
        label: "Open Trial",
        Icon: ClipboardList,
      },
    ],
  },
  {
    label: "TIM",
    items: [
      { key: "roster", href: "/roster", label: "Roster", Icon: Users },
      { key: "polls", href: "/polls", label: "Polling", Icon: BarChart3 },
      {
        key: "development",
        href: "/development",
        label: "Development",
        Icon: TrendingUp,
      },
      {
        key: "sponsors",
        href: "/sponsors",
        label: "Sponsor",
        Icon: Handshake,
      },
      {
        key: "salary",
        href: "/salary",
        label: "Gaji & Bonus",
        Icon: Banknote,
      },
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

const WorkspaceSidebar = ({
  orgSlug,
  orgId,
  orgName,
  orgLogoUrl,
  divisions,
  managedTeams,
  user,
}: WorkspaceSidebarProps) => {
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

  const isManager = user.role === "manager";

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

  const hasScoutingAccess =
    user.role === "owner" ||
    user.role === "manager" ||
    user.role === "coach" ||
    user.role === "captain";

  const hasTrialsAccess =
    user.role === "owner" ||
    user.role === "manager";

  const hasSalaryAccess =
    user.role === "captain" ||
    user.role === "coach" ||
    user.role === "member";

  const allGroups: NavGroup[] = (isManager
    ? [getManagerNavGroup(orgSlug), ...WORKSPACE_NAV_GROUPS]
    : WORKSPACE_NAV_GROUPS)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.key === "files") return hasFilesAccess;
        if (item.key === "scouting") return hasScoutingAccess;
        if (item.key === "trials") return hasTrialsAccess;
        if (item.key === "salary") return hasSalaryAccess;
        if (item.key === "development") return !isManager;
        return true;
      }),
    }));

  return (
    <aside className="print-hide hidden md:flex md:w-[280px] md:flex-col md:border-r md:border-ui-border md:bg-ui-surface h-screen sticky top-0">
      {/* Org header */}
      <div className="flex h-12 shrink-0 items-center border-b border-ui-border">
        <Link
          href={`/${orgSlug}`}
          className="flex h-full min-w-0 flex-1 items-center gap-3 px-4 transition hover:bg-ui-hover"
        >
          {orgLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgLogoUrl}
              alt={orgName}
              className="h-5 w-5 rounded object-cover"
            />
          ) : (
            <div className="grid h-5 w-5 place-items-center rounded bg-ui-hover-strong text-xs font-semibold text-ui-text">
              {orgName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ui-text-dim">
              {orgName}
            </p>
          </div>
          {user.role && (
            <span
              className={`shrink-0 text-[10px] font-bold uppercase tracking-widest ${ROLE_BADGE[user.role] ?? "text-ui-text-2"}`}
            >
              {user.role}
            </span>
          )}
        </Link>
      </div>

      {/* Team switcher — only for managers with multiple teams */}
      {managedTeams && managedTeams.length > 1 && (
        <TeamSwitcher teams={managedTeams} currentSlug={orgSlug} />
      )}

      {/* Division switcher */}
      {divisions.length > 1 && (
        <div className="px-3 pt-3">
          <button
            type="button"
            aria-expanded={divisionOpen}
            onClick={() => setDivisionOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-ui-text-2 transition hover:bg-ui-hover"
          >
            <span className="truncate">
              {activeDivision?.name ?? "Pilih divisi"}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition ${divisionOpen ? "rotate-180" : ""}`}
            />
          </button>
          {divisionOpen && (
            <ul className="mt-1 max-h-60 overflow-auto rounded border border-ui-border bg-ui-surface p-1 text-sm">
              {divisions.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDivision(d.id);
                      setDivisionOpen(false);
                    }}
                    className={`block w-full truncate rounded px-3 py-1.5 text-left transition hover:bg-ui-hover ${
                      d.id === activeDivision?.id
                        ? "bg-ui-hover text-ui-text-dim"
                        : "text-ui-text-2"
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
        {user.role === "owner" && (
          <div className="pb-1 border-b border-ui-border mb-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded px-3 py-1.5 text-xs text-ui-text-muted hover:bg-ui-hover hover:text-ui-text-2 transition"
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
              Owner Dashboard
            </Link>
          </div>
        )}
        {allGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-ui-text-muted">
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
                          ? "bg-ui-hover font-medium text-ui-text-dim"
                          : "text-ui-text-2 hover:bg-ui-hover hover:text-ui-text-dim"
                      }`}
                    >
                      <item.Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                      {item.key === "manage-todos" && <TodoBadge orgId={orgId} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Settings — separated */}
      <div className="border-t border-ui-border px-2 py-3">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-1.5 text-sm text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text-dim"
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          Settings
        </button>
        <div className="mt-1 flex items-center justify-between rounded px-3 py-1.5">
          <span className="text-sm text-ui-text-2">Tema</span>
          <ThemeToggle />
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userId={user.userId}
        orgId={orgId}
        role={user.role ?? "member"}
      />

      {/* User footer */}
      <div className="border-t border-ui-border px-3 py-3">
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
            <div className="grid h-5 w-5 place-items-center rounded-full bg-ui-hover-strong text-[10px] font-semibold text-ui-text-dim">
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <p className="min-w-0 flex-1 truncate text-xs text-ui-text-2">
            {user.email ?? user.displayName}
          </p>
        </div>
      </div>
    </aside>
  );
};
export { WorkspaceSidebar, getManagerNavGroup };
