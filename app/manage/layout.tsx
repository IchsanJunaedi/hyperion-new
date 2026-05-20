import { redirect } from "next/navigation";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { ManageBreadcrumb } from "@/components/layout/ManageBreadcrumb";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logoutAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/manage");

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);

  if (isOwner) redirect("/dashboard");

  const admin = createAdminClient();

  // Get manager's membership
  const { data: membership } = await admin
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/");

  // Get org details
  let orgSlug = "";
  let orgName = "Tim";
  let orgLogoUrl: string | null = null;
  let resolvedOrgId = "";
  let divisions: Array<{ id: string; name: string }> = [];

  const orgId = membership?.organization_id;

  if (orgId) {
    const { data: org } = await admin
      .from("organizations")
      .select("id, slug, name, logo_url")
      .eq("id", orgId)
      .maybeSingle();

    if (org) {
      resolvedOrgId = org.id;
      orgSlug = org.slug;
      orgName = org.name;
      orgLogoUrl = org.logo_url;

      const { data: divs } = await admin
        .from("divisions")
        .select("id, name")
        .eq("organization_id", org.id)
        .eq("is_active", true)
        .order("name");
      divisions = divs ?? [];
    }
  } else if (isOwner) {
    // Owner without team_members row — find their org by owner_id
    const { data: org } = await admin
      .from("organizations")
      .select("id, slug, name, logo_url")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (org) {
      resolvedOrgId = org.id;
      orgSlug = org.slug;
      orgName = org.name;
      orgLogoUrl = org.logo_url;

      const { data: divs } = await admin
        .from("divisions")
        .select("id, name")
        .eq("organization_id", org.id)
        .eq("is_active", true)
        .order("name");
      divisions = divs ?? [];
    }
  }

  // Get user display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ??
    (user.user_metadata?.["display_name"] as string | undefined) ??
    user.email ??
    "Akun saya";

  const userRole = isOwner ? "owner" : (membership?.role ?? "manager");

  return (
    <NotifyProvider>
      <div className="flex min-h-screen bg-[#191919] text-[#E5E2E1]">
        {/* Unified sidebar — same as workspace */}
        <WorkspaceSidebar
          orgSlug={orgSlug}
          orgId={resolvedOrgId}
          orgName={orgName}
          orgLogoUrl={orgLogoUrl}
          divisions={divisions}
          user={{
            displayName,
            avatarUrl: profile?.avatar_url ?? null,
            userId: user.id,
            email: user.email ?? undefined,
            role: userRole,
          }}
        />

        {/* Main content */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Breadcrumb header */}
          <ManageBreadcrumb orgName={orgName} orgSlug={orgSlug} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
            {children}
          </main>
        </div>
      </div>
    </NotifyProvider>
  );
}
