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

  // Phase 1: org lookup + auth in parallel
  const supabase = await createClient();
  const [organization, { data: { user } }] = await Promise.all([
    getOrgBySlug(slug),
    supabase.auth.getUser(),
  ]);
  if (!organization) notFound();
  if (!user) redirect(`/login?next=/${slug}`);

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = user.email === ownerEmail;

  // Phase 2: member check + team data + role lookup all in parallel
  const [memberResult, teamData, membershipRow] = await Promise.all([
    isOwner ? Promise.resolve(true) : isCurrentUserMember(organization.id),
    getPublicTeamData(organization),
    isOwner
      ? Promise.resolve({ data: null as { role: string } | null })
      : supabase
          .from("team_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("organization_id", organization.id)
          .eq("is_active", true)
          .maybeSingle(),
  ]);

  if (!isOwner && !memberResult) redirect(`/${slug}`);

  const { divisions } = teamData;
  const userRole: string | undefined = isOwner ? "owner" : (membershipRow.data?.role ?? undefined);

  // Phase 3: if manager, fetch all their managed teams for team switcher
  const isManager = userRole === "manager";
  let managedTeams: Array<{ id: string; slug: string; name: string; logoUrl: string | null }> = [];

  if (isManager) {
    const { data: allMemberships } = await supabase
      .from("team_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("role", "manager")
      .eq("is_active", true)
      .limit(20);

    const allOrgIds = [
      ...new Set((allMemberships ?? []).map((m) => m.organization_id)),
    ];

    if (allOrgIds.length > 1) {
      const { data: orgsData } = await supabase
        .from("organizations")
        .select("id, slug, name, logo_url")
        .in("id", allOrgIds)
        .limit(20);

      managedTeams = (orgsData ?? []).map((o) => ({
        id: o.id,
        slug: o.slug,
        name: o.name,
        logoUrl: o.logo_url,
      }));
    }
  }

  return (
    <div className="flex min-h-screen flex-1">
      <WorkspaceSidebar
        orgSlug={organization.slug}
        orgId={organization.id}
        orgName={organization.name}
        orgLogoUrl={organization.logo_url}
        divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
        managedTeams={managedTeams.length > 1 ? managedTeams : undefined}
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
      <div className="print-main flex min-w-0 flex-1 flex-col bg-ui-bg min-h-screen pb-20 md:pb-0">
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
