import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsors } from "@/features/sponsors/queries";
import { SponsorListClient } from "@/features/sponsors/components/SponsorListClient";

export const dynamic = "force-dynamic";

export default async function ManageSponsorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/sponsors");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/manage");

  const orgId = membership.organization_id;
  const sponsors = await getSponsors([orgId]);

  return (
    <SponsorListClient
      sponsors={sponsors}
      orgId={orgId}
      detailBasePath="/manage/sponsors"
    />
  );
}
