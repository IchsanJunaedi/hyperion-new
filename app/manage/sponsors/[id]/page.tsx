import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsorDetail } from "@/features/sponsors/queries";
import { SponsorDetailClient } from "@/features/sponsors/components/SponsorDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageSponsorDetailPage({ params }: Props) {
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

  const { id } = await params;
  const sponsor = await getSponsorDetail(id);
  if (!sponsor) notFound();

  if (sponsor.organization_id !== membership.organization_id) notFound();

  return (
    <SponsorDetailClient
      sponsor={sponsor}
      orgId={membership.organization_id}
      backHref="/manage/sponsors"
      listHref="/manage/sponsors"
    />
  );
}
