import { notFound } from "next/navigation";

import { Header } from "@/components/landing/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { WorkspaceTopbar } from "@/components/layout/WorkspaceTopbar";
import { WorkspaceBreadcrumb } from "@/components/layout/WorkspaceBreadcrumb";
import { PublicTeamProfile } from "@/components/team/PublicTeamProfile";
import { TeamHome } from "@/components/team/TeamHome";
import {
  getOrgBySlug,
  getPersonalPlayerStats,
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

  // Check if user is owner (by email) — owner has access to all teams
  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = user?.email === ownerEmail;

  const member = isOwner || await isCurrentUserMember(organization.id);

  if (!member) {
    const publicData = await getPublicTeamData(organization);
    return (
      <>
        <Header />
        <PublicTeamProfile {...publicData} />
      </>
    );
  }

  if (!user) notFound();

  const [data, currentUserRole] = await Promise.all([
    getTeamHomeData(organization),
    getCurrentUserRole(organization.id),
  ]);
  const canManageScrims = ["captain", "coach", "manager", "owner"].includes(currentUserRole ?? "");
  const personalStats =
    !isOwner && (currentUserRole === "captain" || currentUserRole === "member")
      ? await getPersonalPlayerStats(organization.id, user.id)
      : null;

  // Fetch current user's attendance for the next scrim (to power the quick-RSVP button)
  let myNextScrimAttendanceStatus: string | undefined = undefined;
  if (data.nextScrim && !isOwner) {
    const { data: att } = await supabase
      .from("scrim_attendances")
      .select("status")
      .eq("scrim_id", data.nextScrim.id)
      .eq("user_id", user.id)
      .maybeSingle();
    myNextScrimAttendanceStatus = att?.status ?? "pending";
  }

  return (
    <div className="flex min-h-screen flex-1">
      <WorkspaceSidebar
        orgSlug={organization.slug}
        orgId={organization.id}
        orgName={organization.name}
        orgLogoUrl={organization.logo_url}
        divisions={data.divisions.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }))}
        user={{
          userId: user.id,
          displayName:
            (user.user_metadata?.["display_name"] as string | undefined) ??
            user.email ??
            "Akun saya",
          avatarUrl: null,
          email: user.email ?? undefined,
          role: isOwner ? "owner" : (currentUserRole ?? undefined),
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-ui-bg min-h-screen pb-20 md:pb-0">
        <WorkspaceTopbar organization={organization} userId={user.id} />
        <WorkspaceBreadcrumb
          orgName={organization.name}
          orgSlug={organization.slug}
          userId={user.id}
          className="hidden md:flex"
        />
        <main className="flex-1">
          <TeamHome data={data} canManageScrims={canManageScrims} personalStats={personalStats} myNextScrimAttendanceStatus={myNextScrimAttendanceStatus} />
        </main>
        <MobileBottomNav orgSlug={organization.slug} />
      </div>
    </div>
  );
}
