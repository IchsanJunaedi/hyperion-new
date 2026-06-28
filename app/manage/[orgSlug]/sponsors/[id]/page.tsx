import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSponsorDetail } from "@/features/sponsors/queries";
import { SponsorDetailClient } from "@/features/sponsors/components/SponsorDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string; id: string }>;
}

const ManageSponsorDetailPage = async ({ params }: Props) => {
  const { orgSlug, id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const sponsor = await getSponsorDetail(id);
  if (!sponsor) notFound();
  if (sponsor.organization_id !== org.id) notFound();

  return (
    <SponsorDetailClient
      sponsor={sponsor}
      orgId={org.id}
      backHref={`/manage/${orgSlug}/sponsors`}
      listHref={`/manage/${orgSlug}/sponsors`}
    />
  );
};
export default ManageSponsorDetailPage;
