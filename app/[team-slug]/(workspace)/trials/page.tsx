import { redirect } from "next/navigation";

import { TrialListClient } from "@/features/trials/components/TrialListClient";
import { listTrials } from "@/features/trials/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ "team-slug": string }>;
}

export default async function TrialsPage({ params }: Props) {
  const { "team-slug": slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${slug}/trials`);

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) redirect("/");

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!membership) redirect("/");

  // Only manager, coach, and owner can access trials — captain and member
  // are redirected to the team home page.
  if (!["manager", "coach", "owner"].includes(membership.role ?? "")) {
    redirect(`/${slug}`);
  }

  const canManage = ["manager", "coach", "owner"].includes(membership.role ?? "");

  const [trials, divisionRes] = await Promise.all([
    listTrials(org.id),
    supabase.from("divisions").select("id").eq("organization_id", org.id).eq("is_active", true).order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  const divisionId = divisionRes.data?.id ?? null;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold text-ui-text">Open Trial</h1>
        <p className="mt-1 text-sm text-ui-text-2">Kelola seleksi pemain baru untuk tim.</p>
      </div>
      <TrialListClient
        orgSlug={slug}
        trials={trials}
        divisionId={divisionId}
        canManage={canManage}
        revalidatePaths={[`/${slug}/trials`]}
      />
    </div>
  );
}
