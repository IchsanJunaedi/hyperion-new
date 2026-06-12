// app/manage/[orgSlug]/layout.tsx
import { notFound, redirect } from "next/navigation";

import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { ManageBreadcrumb } from "@/components/layout/ManageBreadcrumb";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface ManageTeamLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

const ManageTeamLayout = async ({ children, params }: ManageTeamLayoutProps) => {
  const { orgSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/manage/${orgSlug}`);

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);
  if (isOwner) redirect("/dashboard");

  const admin = createAdminClient();

  // Get ALL orgs this manager manages — used for team switcher + access check
  const { data: allMemberships } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("is_active", true)
    .limit(20);

  const allOrgIds = [
    ...new Set((allMemberships ?? []).map((m) => m.organization_id)),
  ];

  if (allOrgIds.length === 0) redirect("/");

  // Get target org by slug
  const { data: org } = await admin
    .from("organizations")
    .select("id, slug, name, logo_url")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  // Validate manager has access to this org
  if (!allOrgIds.includes(org.id)) redirect("/manage");

  // Parallel: all managed orgs details + divisions for this org + user profile
  const [allOrgsRes, divsRes, profileRes] = await Promise.all([
    admin
      .from("organizations")
      .select("id, slug, name, logo_url")
      .in("id", allOrgIds),
    admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const managedTeams = (allOrgsRes.data ?? []).map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    logoUrl: o.logo_url,
  }));

  const divisions = (divsRes.data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
  }));

  const profile = profileRes.data;
  const displayName =
    profile?.display_name ??
    (user.user_metadata?.["display_name"] as string | undefined) ??
    user.email ??
    "Akun saya";

  return (
    <QueryProvider>
    <NotifyProvider>
      <div className="flex min-h-screen bg-ui-bg text-ui-text">
        <WorkspaceSidebar
          orgSlug={org.slug}
          orgId={org.id}
          orgName={org.name}
          orgLogoUrl={org.logo_url}
          divisions={divisions}
          managedTeams={managedTeams}
          user={{
            displayName,
            avatarUrl: profile?.avatar_url ?? null,
            userId: user.id,
            email: user.email ?? undefined,
            role: "manager",
          }}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <ManageBreadcrumb
            orgName={org.name}
            orgSlug={org.slug}
            userId={user.id}
          />
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
            {children}
          </main>
        </div>
      </div>
    </NotifyProvider>
    </QueryProvider>
  );
};
export default ManageTeamLayout;
