import { notFound, redirect } from "next/navigation";

import { Header } from "@/components/landing/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { WorkspaceTopbar } from "@/components/layout/WorkspaceTopbar";
import { PublicTeamProfile } from "@/components/team/PublicTeamProfile";
import { TeamHome } from "@/components/team/TeamHome";
import {
  getOrgBySlug,
  getPublicTeamData,
  getTeamHomeData,
  isCurrentUserMember,
} from "@/features/teams/queries";
import { getCurrentUserRole } from "@/features/roster/queries";
import { createClient } from "@/lib/supabase/server";
import type { AppMetadataWithOrgs } from "@/types/jwt";

export const dynamic = "force-dynamic";

interface TeamSlugPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function TeamSlugPage({ params }: TeamSlugPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const member = await isCurrentUserMember(organization.id);

  if (!member) {
    if (!user) {
      redirect(`/login?next=/${encodeURIComponent(slug)}`);
    }
    const publicData = await getPublicTeamData(organization);
    return (
      <>
        <Header />
        <PublicTeamProfile {...publicData} />
      </>
    );
  }

  if (!user) notFound();

  // If the user was added to this org after their last login, the JWT
  // app_metadata.organizations claim is stale and the middleware will block
  // all workspace sub-routes (e.g. /scrim, /roster). Detect the mismatch
  // and force a token refresh so the next navigation carries the correct claim.
  const jwtOrgs =
    (user.app_metadata as AppMetadataWithOrgs | undefined)?.organizations ?? [];
  if (!jwtOrgs.some((o) => o.slug === organization.slug)) {
    await supabase.auth.refreshSession();
    redirect(`/${slug}`);
  }

  const data = await getTeamHomeData(organization);
  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManageScrims = ["captain", "manager", "owner"].includes(currentUserRole ?? "");

  return (
    <div className="flex min-h-screen flex-1">
      <WorkspaceSidebar
        orgSlug={organization.slug}
        orgName={organization.name}
        orgLogoUrl={organization.logo_url}
        divisions={data.divisions.map((d) => ({ id: d.id, name: d.name }))}
        user={{
          userId: user.id,
          displayName:
            (user.user_metadata?.["display_name"] as string | undefined) ??
            user.email ??
            "Akun saya",
          avatarUrl: null,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <WorkspaceTopbar organization={organization} userId={user.id} />
        <main className="flex-1">
          <TeamHome data={data} canManageScrims={canManageScrims} />
        </main>
        <MobileBottomNav orgSlug={organization.slug} />
      </div>
    </div>
  );
}
