import { redirect } from "next/navigation";

import { TrialListClient } from "@/features/trials/components/TrialListClient";
import { listTrials } from "@/features/trials/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ "team-slug": string }>;
}

export default async function TrialsPage({ params }: Props) {
  const { "team-slug": slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${slug}/trials`);

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

  const canManage = ["manager", "coach", "owner"].includes(membership.role ?? "");

  const [trials, divisionsRes] = await Promise.all([
    listTrials(org.id),
    admin.from("divisions").select("id, name, game").eq("organization_id", org.id).eq("is_active", true).order("name"),
  ]);
  const divisions = divisionsRes.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Open Trial</h1>
        <p className="mt-1 text-sm text-[#9B9A97]">Kelola seleksi pemain baru untuk tim.</p>
      </div>
      <TrialListClient
        orgSlug={slug}
        trials={trials}
        divisions={divisions}
        canManage={canManage}
        revalidatePaths={[`/${slug}/trials`]}
      />
    </div>
  );
}
