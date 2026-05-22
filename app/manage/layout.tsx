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

  const orgId = membership.organization_id;

  // Fetch org details, divisions, and profile all in parallel
  const [orgRes, divsRes, profileRes] = await Promise.all([
    admin
      .from("organizations")
      .select("id, slug, name, logo_url")
      .eq("id", orgId)
      .maybeSingle(),
    admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const org = orgRes.data;
  const resolvedOrgId = org?.id ?? "";
  const orgSlug = org?.slug ?? "";
  const orgName = org?.name ?? "Tim";
  const orgLogoUrl = org?.logo_url ?? null;
  const divisions: Array<{ id: string; name: string }> = divsRes.data ?? [];

  const profile = profileRes.data;
  const displayName =
    profile?.display_name ??
    (user.user_metadata?.["display_name"] as string | undefined) ??
    user.email ??
    "Akun saya";

  const userRole = membership.role;

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
          <ManageBreadcrumb orgName={orgName} orgSlug={orgSlug} userId={user.id} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
            {children}
          </main>
        </div>
      </div>
    </NotifyProvider>
  );
}
