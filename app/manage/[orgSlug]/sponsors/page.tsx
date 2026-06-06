import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsors } from "@/features/sponsors/queries";
import { SponsorListClient } from "@/features/sponsors/components/SponsorListClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageSponsorsPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const sponsors = await getSponsors([org.id]);

  return (
    <SponsorListClient
      sponsors={sponsors}
      orgId={org.id}
      orgName={org.name}
      detailBasePath={`/manage/${orgSlug}/sponsors`}
    />
  );
};
export default ManageSponsorsPage;
