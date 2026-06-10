import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { adminLogoutAction } from "@/lib/actions/adminAuth";
import { AdminSidebarNav } from "@/features/admin/components/AdminSidebarNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
    <div className="flex min-h-screen bg-ui-bg text-ui-text">
      <aside className="hidden md:flex w-[260px] h-screen fixed left-0 top-0 bg-ui-surface flex-col border-r border-ui-border text-sm">
        <div className="flex h-12 shrink-0 items-center border-b border-ui-border px-4 gap-3">
          <div className="grid h-5 w-5 place-items-center rounded bg-[#F5C400] text-[10px] font-black text-black">
            A
          </div>
          <p className="flex-1 text-sm font-bold text-ui-text-dim">Admin Panel</p>
          <Link
            href="/"
            target="_blank"
            className="text-ui-text-muted hover:text-ui-text-dim transition"
            title="Lihat public site"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <AdminSidebarNav />

        <div className="border-t border-ui-border px-3 py-2 shrink-0">
          <div className="flex items-center justify-between rounded px-2 py-1.5">
            <span className="text-sm text-ui-text-2">Tema</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="border-t border-ui-border px-3 py-3 shrink-0">
          <div className="flex items-center gap-3 rounded px-2 py-2">
            <div className="grid h-5 w-5 place-items-center rounded-full bg-ui-hover-strong text-[10px] font-semibold text-ui-text-dim">
              {(user.email ?? "A").slice(0, 2).toUpperCase()}
            </div>
            <p className="min-w-0 flex-1 truncate text-xs text-ui-text-2">{user.email}</p>
            <form action={adminLogoutAction}>
              <button
                type="submit"
                aria-label="Logout"
                className="rounded p-1.5 text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text-dim cursor-pointer"
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
