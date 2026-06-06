import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ManagePage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage");

  const admin = createAdminClient();
  const { data: memberships } = await admin
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

  const firstOrgId = orgIds[0]!;

  const { data: firstOrg } = await admin
    .from("organizations")
    .select("slug")
    .eq("id", firstOrgId)
    .maybeSingle();

  redirect(`/manage/${firstOrg?.slug ?? "/"}`);
};
export default ManagePage;
