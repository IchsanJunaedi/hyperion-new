import { notFound, redirect } from "next/navigation";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { WorkspaceTopbar } from "@/components/layout/WorkspaceTopbar";
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

  const member = await isCurrentUserMember(organization.id);
  if (!member) redirect(`/${slug}`);

  const { divisions } = await getPublicTeamData(organization);

  return (
    <div className="flex min-h-screen flex-1">
      <WorkspaceSidebar
        orgSlug={organization.slug}
        orgName={organization.name}
        orgLogoUrl={organization.logo_url}
        divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
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
        <main className="flex-1">{children}</main>
        <MobileBottomNav orgSlug={organization.slug} />
      </div>
    </div>
  );
}
