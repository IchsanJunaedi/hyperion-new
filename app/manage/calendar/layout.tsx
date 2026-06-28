import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const dynamic = "force-dynamic";

const ManageCalendarLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/calendar");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (Boolean(ownerEmail && user.email === ownerEmail)) redirect("/dashboard");

  // Use regular supabase client — RLS enforces per-org access for managers
  const { data: memberships } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("is_active", true)
    .limit(20);

  const orgIds = [
    ...new Set((memberships ?? []).map((m) => m.organization_id)),
  ];

  if (orgIds.length === 0) redirect("/");

  const [orgsRes, profileRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, slug, name, logo_url")
      .in("id", orgIds)
      .limit(20),
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (orgsRes.error) console.error("[manage/calendar] orgs:", orgsRes.error);
  if (profileRes.error) console.error("[manage/calendar] profile:", profileRes.error);

  const orgs = orgsRes.data ?? [];
  const firstOrg = orgs[0];
  if (!firstOrg) redirect("/");

  const profile = profileRes.data;
  const displayName =
    profile?.display_name ??
    (user.user_metadata?.["display_name"] as string | undefined) ??
    user.email ??
    "Akun saya";

  const managedTeams = orgs.map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    logoUrl: o.logo_url,
  }));

  return (
    <QueryProvider>
    <NotifyProvider>
      <div className="flex min-h-screen bg-ui-bg text-ui-text">
        <WorkspaceSidebar
          orgSlug={firstOrg.slug}
          orgId={firstOrg.id}
          orgName={firstOrg.name}
          orgLogoUrl={firstOrg.logo_url}
          divisions={[]}
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
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
            {children}
          </main>
        </div>
      </div>
    </NotifyProvider>
    </QueryProvider>
  );
};
export default ManageCalendarLayout;
