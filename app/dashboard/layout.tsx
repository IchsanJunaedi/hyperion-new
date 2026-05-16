import Link from "next/link";
import {
  BarChart3,
  Building2,
  Calendar,
  DollarSign,
  Download,
  FileText,
  Home,
  ListChecks,
  LogOut,
  Trophy,
  Users,
  Shield,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logoutAction } from "@/lib/actions/auth";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";
import { DashboardSettingsButton } from "@/components/layout/DashboardSettingsButton";

export const dynamic = "force-dynamic";

interface NavItemProps {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItemProps[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/dashboard", Icon: Home, label: "Home" },
      { href: "/dashboard/calendar", Icon: Calendar, label: "Calendar" },
      { href: "/dashboard/tournaments", Icon: Trophy, label: "Turnamen" },
    ],
  },
  {
    label: "MANAJEMEN",
    items: [
      { href: "/dashboard/managers", Icon: Shield, label: "Manager \u2014 Tim & Divisi" },
      { href: "/dashboard/users", Icon: Users, label: "User Active" },
      { href: "/dashboard/teams", Icon: Building2, label: "Tim / Organisasi" },
      { href: "/dashboard/finances", Icon: DollarSign, label: "Kas Tim" },
    ],
  },
  {
    label: "KONTEN & LAPORAN",
    items: [
      { href: "/dashboard/content", Icon: FileText, label: "Konten" },
      { href: "/dashboard/reports", Icon: BarChart3, label: "Laporan" },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/dashboard/audit", Icon: ListChecks, label: "Audit Log" },
      { href: "/dashboard/export", Icon: Download, label: "Export Data" },
    ],
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = user?.email ?? "Owner";
  let avatarUrl: string | null = null;
  let orgName = "Hyperion Team";
  let dashboardOrgId = "";
  let orgLogoUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      displayName = profile.display_name ?? (user.user_metadata?.["display_name"] as string | undefined) ?? user.email ?? "Owner";
      avatarUrl = profile.avatar_url ?? null;
      orgName = profile.full_name ?? "Hyperion Team";
      orgLogoUrl = profile.avatar_url ?? null;
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    if (org) {
      dashboardOrgId = org.id;
    }
  }

  return (
    <NotifyProvider>
      <div className="flex min-h-screen bg-[#191919] text-[#E5E2E1]">
        {/* Sidebar */}
        <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#202020] flex flex-col border-r border-[#2D2D2D] text-sm">
          {/* Org header */}
          <div className="flex items-center gap-3 border-b border-[#2D2D2D] px-4 h-12 shrink-0">
            {orgLogoUrl ? (
              <img src={orgLogoUrl} alt="Logo" className="h-5 w-5 rounded object-cover" />
            ) : (
              <div className="grid h-5 w-5 place-items-center rounded bg-[#353434] text-xs font-semibold text-[#E5E2E1]">
                {orgName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#D4D4D4]">
              {orgName}
            </p>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
              owner
            </span>
          </div>

          {/* Nav groups */}
          <nav aria-label="Dashboard" className="sidebar-scroll flex-1 overflow-y-auto px-2 pt-4 space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B6A68]">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <NavLink href={item.href} Icon={item.Icon} label={item.label} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Settings */}
          <div className="border-t border-[#2D2D2D] px-2 py-3 shrink-0">
            {user && (
              <DashboardSettingsButton userId={user.id} orgId={dashboardOrgId} />
            )}
          </div>

          {/* User footer */}
          <div className="border-t border-[#2D2D2D] px-3 py-3 shrink-0">
            <div className="flex items-center gap-3 rounded px-2 py-2">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-5 w-5 place-items-center rounded-full bg-[#353434] text-[10px] font-semibold text-[#D4D4D4]">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <p className="min-w-0 flex-1 truncate text-xs text-[#9B9A97]">
                {user?.email ?? displayName}
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

        {/* Main content */}
        <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
          {children}
        </div>
      </div>
    </NotifyProvider>
  );
}

function NavLink({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded px-3 py-1.5 text-sm text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {label}
    </Link>
  );
}
