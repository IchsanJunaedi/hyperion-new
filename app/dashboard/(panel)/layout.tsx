import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dashboardLogoutAction } from "@/lib/actions/auth";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";
import { DashboardSettingsButton } from "@/components/layout/DashboardSettingsButton";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { NotificationRealtimeProvider } from "@/features/notifications/components/NotificationRealtimeProvider";
import { DashboardSidebarNav } from "@/components/layout/DashboardSidebarNav";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { getTodoBadgeCount } from "@/features/todos/queries";

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

  if (!user) {
    redirect("/dashboard/login");
  }

  let displayName = user?.email ?? "Owner";
  let avatarUrl: string | null = null;
  let orgName = "Hyperion Team";
  let dashboardOrgId = "";
  let orgLogoUrl: string | null = null;
  let orgSlug = "";

  // Fetch profile + org in parallel (both only need user.id)
  const [{ data: profile }, { data: org }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("id, slug, name, logo_url")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (profile) {
    displayName = profile.display_name ?? (user.user_metadata?.["display_name"] as string | undefined) ?? user.email ?? "Owner";
    avatarUrl = profile.avatar_url ?? null;
  }
  if (org) {
    dashboardOrgId = org.id;
    orgSlug = org.slug ?? "";
    orgName = (org as unknown as { name?: string; logo_url?: string | null }).name ?? "Hyperion Team";
    orgLogoUrl = (org as unknown as { name?: string; logo_url?: string | null }).logo_url ?? null;
  }

  let todoBadgeCount = 0;
  if (dashboardOrgId) {
    try {
      todoBadgeCount = await getTodoBadgeCount(dashboardOrgId, user.id);
    } catch {
      // badge count is non-critical
    }
  }

  const workspaceName = profile?.full_name ?? profile?.display_name ?? orgName;

  return (
    <NotifyProvider>
      <div className="flex min-h-screen bg-[#191919] text-[#E5E2E1]">
        {/* Sidebar */}
        <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#202020] flex flex-col border-r border-[#2D2D2D] text-sm">
          {/* Org header */}
          <div className="flex h-12 shrink-0 items-center border-b border-[#2D2D2D]">
            {orgSlug ? (
              <Link
                href={`/${orgSlug}`}
                className="flex h-full min-w-0 flex-1 items-center gap-3 px-4 transition hover:bg-[#2C2C2C]"
                title="Buka Workspace"
              >
                {orgLogoUrl ? (
                  <img src={orgLogoUrl} alt="Logo" className="h-5 w-5 rounded object-cover" />
                ) : (
                  <div className="grid h-5 w-5 place-items-center rounded bg-[#353434] text-xs font-semibold text-[#E5E2E1]">
                    {workspaceName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#D4D4D4]">
                  {workspaceName}
                </p>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                  owner
                </span>
              </Link>
            ) : (
              <div className="flex h-full min-w-0 flex-1 items-center gap-3 px-4">
                {orgLogoUrl ? (
                  <img src={orgLogoUrl} alt="Logo" className="h-5 w-5 rounded object-cover" />
                ) : (
                  <div className="grid h-5 w-5 place-items-center rounded bg-[#353434] text-xs font-semibold text-[#E5E2E1]">
                    {workspaceName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#D4D4D4]">
                  {workspaceName}
                </p>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                  owner
                </span>
              </div>
            )}
          </div>

          {/* Nav groups */}
          <DashboardSidebarNav badgeCount={todoBadgeCount} />

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
              <form action={dashboardLogoutAction}>
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
          <NotificationRealtimeProvider userId={user?.id ?? ""}>
            <DashboardHeader
              workspaceName={workspaceName}
              userId={user.id}
              orgSlug={orgSlug}
            />
            {children}
          </NotificationRealtimeProvider>
        </div>
      </div>
    </NotifyProvider>
  );
}
