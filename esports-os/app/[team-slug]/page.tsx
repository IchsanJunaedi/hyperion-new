import { notFound } from "next/navigation";

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
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface TeamSlugPageProps {
  params: Promise<{ "team-slug": string }>;
}

/**
 * Root team page at `/{slug}`.
 *
 * Branches at runtime based on auth + membership:
 * - Org doesn't exist → 404
 * - Anonymous visitor / authed non-member → public read-only profile
 * - Authed member → workspace Team Home (with sidebar shell)
 *
 * The middleware handles cross-org redirects for sub-paths; this page
 * does the same logic at the leaf for the root URL only.
 */
export default async function TeamSlugPage({ params }: TeamSlugPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const member = await isCurrentUserMember(organization.id);

  if (!member) {
    const publicData = await getPublicTeamData(organization);
    return (
      <>
        <Header />
        <PublicTeamProfile {...publicData} />
      </>
    );
  }

  // Member-facing workspace Team Home
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // We just verified membership above, so user is non-null. The cast is
  // safe but we still narrow with a runtime guard for type safety.
  if (!user) notFound();

  const data = await getTeamHomeData(organization);

  return (
    <div className="flex min-h-screen flex-1">
      <WorkspaceSidebar
        orgSlug={organization.slug}
        orgName={organization.name}
        orgLogoUrl={organization.logo_url}
        divisions={data.divisions.map((d) => ({ id: d.id, name: d.name }))}
        user={{
          displayName:
            (user.user_metadata?.["display_name"] as string | undefined) ??
            user.email ??
            "Akun saya",
          avatarUrl: null,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <WorkspaceTopbar organization={organization} />
        <main className="flex-1">
          <TeamHome data={data} />
        </main>
        <MobileBottomNav orgSlug={organization.slug} />
      </div>
    </div>
  );
}
