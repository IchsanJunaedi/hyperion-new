import { redirect } from "next/navigation";

import { TrialDetailClient } from "@/features/trials/components/TrialDetailClient";
import { getTrialById, listApplicants } from "@/features/trials/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function TrialDetailPage({ params }: Props) {
  const { "team-slug": slug, id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${slug}/trials/${id}`);

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) redirect("/");

  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!membership) redirect("/");

  const [trial, applicants] = await Promise.all([
    getTrialById(id),
    listApplicants(id),
  ]);

  if (!trial || trial.org_id !== org.id) redirect(`/${slug}/trials`);

  const canManage = ["manager", "coach", "owner"].includes(membership.role ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Detail Trial</h1>
      </div>
      <TrialDetailClient
        trial={trial}
        applicants={applicants}
        canManage={canManage}
        appUrl={appUrl}
        revalidatePaths={[`/${slug}/trials`, `/${slug}/trials/${id}`]}
      />
    </div>
  );
}
