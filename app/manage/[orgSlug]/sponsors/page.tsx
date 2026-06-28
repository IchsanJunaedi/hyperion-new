import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSponsors } from "@/features/sponsors/queries";
import { SponsorListClient } from "@/features/sponsors/components/SponsorListClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageSponsorsPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
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
