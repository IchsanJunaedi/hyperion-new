import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Plus, Shield, Swords, Tags } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
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

  // Check if user is manager (or owner)
  const { data: membership } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("user_id", user.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwnerByEmail = ownerEmail && user.email === ownerEmail;

  if (!membership && !isOwnerByEmail) redirect("/");

  return (
    <NotifyProvider>
    <div className="flex min-h-screen bg-[#191919] text-[#E5E2E1]">
      {/* Sidebar */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#202020] flex flex-col border-r border-[#2D2D2D] text-[#9B9A97] text-sm">
        <div className="flex items-center gap-2 p-4 hover:bg-[#2C2C2C] cursor-pointer transition-colors mt-2">
          <div className="w-5 h-5 bg-[#353434] rounded flex items-center justify-center text-xs text-[#E5E2E1] font-semibold shrink-0">
            H
          </div>
          <span className="font-medium text-[#D4D4D4] truncate">Hyperion Team</span>
        </div>

        <div className="px-2 flex-1 overflow-y-auto">
          <div className="px-3 py-1 text-xs font-semibold text-[#6B6A68] mb-1">
            Manager Panel
          </div>
          <nav className="flex flex-col gap-0.5">
            <Link href="/manage" className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#2C2C2C] rounded transition-colors">
              <LayoutDashboard className="h-[18px] w-[18px]" />
              <span>Overview</span>
            </Link>
            <Link href="/manage/assign" className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#2C2C2C] rounded transition-colors">
              <Plus className="h-[18px] w-[18px]" />
              <span>Tambah Member</span>
            </Link>
            <Link href="/manage/divisions" className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#2C2C2C] rounded transition-colors">
              <Tags className="h-[18px] w-[18px]" />
              <span>Edit Divisi</span>
            </Link>
            <Link href="/manage/captains" className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#2C2C2C] rounded transition-colors">
              <Swords className="h-[18px] w-[18px]" />
              <span>Edit Captain</span>
            </Link>
          </nav>
        </div>

        {/* User footer */}
        <div className="border-t border-[#2D2D2D] p-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-[#9B9A97] truncate">{user.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="text-xs text-[#9B9A97] hover:text-[#D4D4D4] transition-colors">
                Logout
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
            <span>/</span>
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
