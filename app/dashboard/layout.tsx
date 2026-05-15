import Link from "next/link";
import {
  BarChart3,
  Building2,
  CalendarClock,
  DollarSign,
  FileOutput,
  Home,
  ListChecks,
  LogOut,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/actions/auth";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <NotifyProvider>
    <div className="flex min-h-screen bg-[#191919] text-[#E5E2E1]">
      {/* Sidebar */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#202020] flex flex-col border-r border-[#2D2D2D] text-sm">
        {/* Org header */}
        <div className="flex items-center gap-2 p-4 hover:bg-[#2C2C2C] cursor-pointer transition-colors shrink-0">
          <div className="w-5 h-5 bg-[#353434] rounded flex items-center justify-center text-xs text-[#E5E2E1] font-semibold shrink-0">
            H
          </div>
          <span className="font-medium text-[#D4D4D4] truncate">Hyperion Team</span>
        </div>

        {/* Nav */}
        <div className="px-2 flex-1 overflow-y-auto">
          <div className="px-3 py-1 text-xs font-semibold text-[#6B6A68] mb-1">Workspace</div>
          <nav className="flex flex-col gap-0.5">
            <NavItem href="/dashboard" Icon={Home} label="Home" />
            <NavItem href="/dashboard/managers" Icon={Shield} label="Manager — Tim & Divisi" />
            <NavItem href="/dashboard/users" Icon={Users} label="User Active" />
            <NavItem href="/dashboard/teams" Icon={Building2} label="Tim / Organisasi" />
            <NavItem href="/dashboard/finances" Icon={DollarSign} label="Kas Tim" />
            <NavItem href="/dashboard/content" Icon={CalendarClock} label="Konten" />
            <NavItem href="/dashboard/audit" Icon={ListChecks} label="Audit Log" />
            <NavItem href="/dashboard/reports" Icon={BarChart3} label="Laporan" />
            <NavItem href="/dashboard/tournaments" Icon={Trophy} label="Turnamen" />
            <NavItem href="/dashboard/export" Icon={FileOutput} label="Export Data" />
          </nav>
        </div>

        {/* User footer */}
        <div className="mt-auto border-t border-[#2D2D2D] p-3 shrink-0">
          {user && (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-[#9B9A97] truncate">{user.email}</span>
              <form action={logoutAction}>
                <button type="submit" className="text-[#9B9A97] hover:text-[#D4D4D4] transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}
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

function NavItem({ href, Icon, label }: { href: string; Icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#2C2C2C] rounded transition-colors text-[#9B9A97]"
    >
      <Icon className="h-[18px] w-[18px]" />
      <span>{label}</span>
    </Link>
  );
}
