import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  CalendarClock,
  DollarSign,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Plus,
  Swords,
  Tags,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logoutAction } from "@/lib/actions/auth";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";

export const dynamic = "force-dynamic";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/manage");

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwnerByEmail = ownerEmail && user.email === ownerEmail;

  const admin = createAdminClient();

  // Get manager's org membership
  const { data: membership } = await admin
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership && !isOwnerByEmail) redirect("/");

  // Get org slug for workspace links
  let orgSlug: string | null = null;
  if (membership) {
    const { data: org } = await admin
      .from("organizations")
      .select("slug")
      .eq("id", membership.organization_id)
      .maybeSingle();
    orgSlug = org?.slug ?? null;
  }

  return (
    <NotifyProvider>
    <div className="flex min-h-screen bg-[#191919] text-[#E5E2E1]">
      {/* Sidebar */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#202020] flex flex-col border-r border-[#2D2D2D] text-[#9B9A97] text-sm">
        <div className="flex items-center gap-2 p-4 hover:bg-[#2C2C2C] cursor-pointer transition-colors shrink-0">
          <div className="w-5 h-5 bg-[#353434] rounded flex items-center justify-center text-xs text-[#E5E2E1] font-semibold shrink-0">
            H
          </div>
          <span className="font-medium text-[#D4D4D4] truncate">Hyperion Team</span>
        </div>

        <div className="px-2 flex-1 overflow-y-auto">
          {/* Manager tools */}
          <div className="px-3 py-1 text-xs font-semibold text-[#6B6A68] mb-1">
            Manager Panel
          </div>
          <nav className="flex flex-col gap-0.5">
            <NavItem href="/manage" Icon={LayoutDashboard} label="Overview" />
            <NavItem href="/manage/assign" Icon={Plus} label="Tambah Member" />
            <NavItem href="/manage/divisions" Icon={Tags} label="Edit Divisi" />
            <NavItem href="/manage/captains" Icon={Swords} label="Edit Captain" />
            <NavItem href="/manage/finances" Icon={DollarSign} label="Kas Tim" />
            <NavItem href="/manage/content" Icon={CalendarClock} label="Konten" />
            <NavItem href="/manage/development" Icon={TrendingUp} label="Player Dev" />
            <NavItem href="/manage/reports" Icon={BarChart3} label="Laporan" />
          </nav>

          {/* Workspace features (linked to team workspace) */}
          {orgSlug && (
            <>
              <div className="px-3 py-1 text-xs font-semibold text-[#6B6A68] mb-1 mt-4">
                Tim
              </div>
              <nav className="flex flex-col gap-0.5">
                <NavItem href={`/${orgSlug}/scrim`} Icon={Swords} label="Jadwal Scrim" />
                <NavItem href={`/${orgSlug}/roster`} Icon={Users} label="Roster" />
                <NavItem href={`/${orgSlug}/calendar`} Icon={Calendar} label="Calendar" />
                <NavItem href={`/${orgSlug}/announcements`} Icon={Megaphone} label="Pengumuman" />
                <NavItem href={`/${orgSlug}/strategy`} Icon={FileText} label="Strategy" />
                <NavItem href={`/${orgSlug}/files`} Icon={FolderOpen} label="Files" />
                <NavItem href={`/${orgSlug}/tournaments`} Icon={Trophy} label="Turnamen" />
              </nav>
            </>
          )}
        </div>

        {/* User footer */}
        <div className="mt-auto border-t border-[#2D2D2D] p-3 shrink-0">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-[#9B9A97] truncate">{user.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="text-[#9B9A97] hover:text-[#D4D4D4] transition-colors">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
        <header className="h-12 flex items-center px-4 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
          <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
            <span>Hyperion Team</span>
            <span className="text-[#6B6A68]">/</span>
            <span className="text-[#D4D4D4]">Manager Panel</span>
          </div>
        </header>
        <main className="flex-1 max-w-[900px] w-full mx-auto px-12 py-10">
          {children}
        </main>
      </div>
    </div>
    </NotifyProvider>
  );
}

function NavItem({ href, Icon, label }: { href: string; Icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#2C2C2C] rounded transition-colors"
    >
      <Icon className="h-[18px] w-[18px]" />
      <span>{label}</span>
    </Link>
  );
}
