import { notFound, redirect } from "next/navigation";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { WorkspaceTopbar } from "@/components/layout/WorkspaceTopbar";
import { WorkspaceBreadcrumb } from "@/components/layout/WorkspaceBreadcrumb";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";
import { NotificationRealtimeProvider } from "@/features/notifications/components/NotificationRealtimeProvider";
import {
  getOrgBySlug,
  getPublicTeamData,
  isCurrentUserMember,
} from "@/features/teams/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "team-slug": string }>;
}

/**
 * Shared workspace shell for all member-only sub-pages under
 * `/{slug}/scrim`, `/{slug}/roster`, etc. The root `/{slug}` is rendered
 * separately in `app/[team-slug]/page.tsx` so it can swap to the public
 * profile for non-members.
 *
 * Non-members hitting a workspace sub-route are kicked back to the public
 * profile (`/{slug}`); anon users to `/login?next=...`.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/${slug}`);

  // Owner (by email) has access to all workspaces
  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = user.email === ownerEmail;

  if (!isOwner) {
    const member = await isCurrentUserMember(organization.id);
    if (!member) redirect(`/${slug}`);
  }

  const { divisions } = await getPublicTeamData(organization);

  // Get user's role in this org
  let userRole: string | undefined;
  if (isOwner) {
    userRole = "owner";
  } else {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .maybeSingle();
    userRole = membership?.role ?? undefined;
  }

  return (
    <div className="flex min-h-screen flex-1">
      <WorkspaceSidebar
        orgSlug={organization.slug}
        orgId={organization.id}
        orgName={organization.name}
        orgLogoUrl={organization.logo_url}
        divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
        user={{
          displayName:
            (user.user_metadata?.["display_name"] as string | undefined) ??
            user.email ??
            "Akun saya",
          avatarUrl: null,
          userId: user.id,
          email: user.email ?? undefined,
          role: userRole,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-[#191919] min-h-screen pb-20 md:pb-0">
        <WorkspaceTopbar organization={organization} userId={user.id} />
        <WorkspaceBreadcrumb
          orgName={organization.name}
          orgSlug={organization.slug}
          userId={user.id}
          className="hidden md:flex"
        />
        <NotificationRealtimeProvider userId={user.id}>
          <NotifyProvider>
            <main className="flex-1">{children}</main>
          </NotifyProvider>
        </NotificationRealtimeProvider>
        <MobileBottomNav orgSlug={organization.slug} />
      </div>
    </div>
  );
}
