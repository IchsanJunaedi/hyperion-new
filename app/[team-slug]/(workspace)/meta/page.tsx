import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgBySlug } from "@/features/teams/queries";
import { getMetaPatches, getLatestPatchWithHeroes, getPatchWithHeroes, getPreviousPatchHeroes } from "@/features/meta/queries";
import { MetaPage } from "@/features/meta/components/MetaPage";

export const dynamic = "force-dynamic";

interface MetaPageRouteProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ patch?: string }>;
}

export default async function MetaPageRoute({ params, searchParams }: MetaPageRouteProps) {
  const { "team-slug": slug } = await params;
  const { patch: patchId } = await searchParams;

  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = user.email === ownerEmail;

  let userRole: string | null = null;
  if (isOwner) {
    userRole = "owner";
  } else {
    const { data: tm } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .maybeSingle();
    userRole = tm?.role ?? null;
  }

  const canEdit = isOwner || ["coach", "manager", "owner"].includes(userRole ?? "");

  const [patches, activePatch] = await Promise.all([
    getMetaPatches(org.id),
    patchId ? getPatchWithHeroes(patchId) : getLatestPatchWithHeroes(org.id),
  ]);

  const previousPatchHeroes = activePatch
    ? await getPreviousPatchHeroes(org.id, activePatch.id)
    : [];

  return (
    <MetaPage
      orgSlug={slug}
      orgId={org.id}
      patches={patches}
      initialPatch={activePatch}
      previousPatchHeroes={previousPatchHeroes}
      canEdit={canEdit}
    />
  );
}
