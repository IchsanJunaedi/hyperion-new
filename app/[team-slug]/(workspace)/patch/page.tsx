import { notFound, redirect } from "next/navigation";
 
import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";
import { getMetaPatches } from "@/features/meta/queries";
import { PatchManagerClient } from "@/features/meta/components/PatchManagerClient";
 
export const dynamic = "force-dynamic";
 
interface PatchPageProps {
  params: Promise<{ "team-slug": string }>;
}
 
const PatchPage = async ({ params }: PatchPageProps) => {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();
 
  const currentUserRole = await getCurrentUserRole(organization.id);
  const isCoachPlus = ["coach", "manager", "owner"].includes(currentUserRole ?? "");
  if (!isCoachPlus) redirect(`/${slug}`);
 
  const isManager = ["manager", "owner"].includes(currentUserRole ?? "");
  const patches = await getMetaPatches(organization.id);
 
  return (
    <div className="px-4 py-6 sm:px-8">
      <PatchManagerClient
        orgSlug={slug}
        orgId={organization.id}
        initialPatches={patches}
        isManager={isManager}
      />
    </div>
  );
};
 
export default PatchPage;
