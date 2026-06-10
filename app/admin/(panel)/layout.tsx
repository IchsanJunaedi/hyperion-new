import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { adminLogoutAction } from "@/lib/actions/adminAuth";
import { AdminSidebarNav } from "@/features/admin/components/AdminSidebarNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== adminEmail && user.email !== ownerEmail) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-[#191919] text-[#E5E2E1]">
      <aside className="hidden md:flex w-[260px] h-screen fixed left-0 top-0 bg-[#202020] flex-col border-r border-[#2D2D2D] text-sm">
        <div className="flex h-12 shrink-0 items-center border-b border-[#2D2D2D] px-4 gap-3">
          <div className="grid h-5 w-5 place-items-center rounded bg-[#F5C400] text-[10px] font-black text-black">
            A
          </div>
          <p className="flex-1 text-sm font-bold text-[#D4D4D4]">Admin Panel</p>
          <Link
            href="/"
            target="_blank"
            className="text-[#6B6A68] hover:text-[#D4D4D4] transition"
            title="Lihat public site"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <AdminSidebarNav />

        <div className="border-t border-[#2D2D2D] px-3 py-3 shrink-0">
          <div className="flex items-center gap-3 rounded px-2 py-2">
            <div className="grid h-5 w-5 place-items-center rounded-full bg-[#353434] text-[10px] font-semibold text-[#D4D4D4]">
              {(user.email ?? "A").slice(0, 2).toUpperCase()}
            </div>
            <p className="min-w-0 flex-1 truncate text-xs text-[#9B9A97]">{user.email}</p>
            <form action={adminLogoutAction}>
              <button
                type="submit"
                aria-label="Logout"
                className="rounded p-1.5 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4] cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
