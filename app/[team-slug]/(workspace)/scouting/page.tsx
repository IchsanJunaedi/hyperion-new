import { notFound, redirect } from "next/navigation";

import { ScoutingPageClient } from "@/features/scouting/components/ScoutingPageClient";
import { listOpponentProfiles } from "@/features/scouting/queries";
import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface ScoutingPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function ScoutingPage({ params }: ScoutingPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  if (
    currentUserRole !== "owner" &&
    currentUserRole !== "manager" &&
    currentUserRole !== "coach" &&
    currentUserRole !== "captain"
  ) {
    redirect(`/${slug}`);
  }

  const profiles = await listOpponentProfiles(organization.id);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <ScoutingPageClient orgSlug={slug} profiles={profiles} />
    </div>
  );
}
