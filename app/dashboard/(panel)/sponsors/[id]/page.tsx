import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsorDetail } from "@/features/sponsors/queries";
import { SponsorDetailClient } from "@/features/sponsors/components/SponsorDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DashboardSponsorDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/");

  const { id } = await params;
  const sponsor = await getSponsorDetail(id);
  if (!sponsor) notFound();

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .eq("id", sponsor.organization_id)
    .maybeSingle();

  if (!org) notFound();

  return (
    <>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-8 py-10">
        <SponsorDetailClient
          sponsor={sponsor}
          orgId={org.id}
          backHref="/dashboard/sponsors"
          listHref="/dashboard/sponsors"
        />
      </main>
    </>
  );
}
