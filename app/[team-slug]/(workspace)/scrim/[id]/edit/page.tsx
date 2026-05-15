import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ScrimEditForm } from "@/features/scrim/components/ScrimEditForm";
import { getPublicTeamData, getOrgBySlug } from "@/features/teams/queries";
import { getScrimDetail } from "@/features/scrim/queries";
import { getCurrentUserRole } from "@/features/roster/queries";

export const dynamic = "force-dynamic";

interface EditScrimPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function EditScrimPage({ params }: EditScrimPageProps) {
  const { "team-slug": slug, id } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManageScrims = ["captain", "manager", "owner"].includes(currentUserRole ?? "");
  if (!canManageScrims) redirect(`/${slug}/scrim/${id}`);

  const detail = await getScrimDetail(id);
  if (!detail) notFound();

  // Don't allow editing completed or cancelled scrims
  if (detail.scrim.status === "completed" || detail.scrim.status === "cancelled") {
    redirect(`/${slug}/scrim/${id}`);
  }

  const { divisions } = await getPublicTeamData(organization);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-1">
        <Link
          href={`/${slug}/scrim/${id}`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Kembali ke detail scrim
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Edit scrim
        </h1>
      </header>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <ScrimEditForm
          orgSlug={slug}
          scrimId={id}
          divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
          initialValues={{
            division_id: detail.scrim.division_id,
            opponent_name: detail.scrim.opponent_name,
            opponent_contact: detail.scrim.opponent_contact,
            scheduled_at: detail.scrim.scheduled_at,
            format: detail.scrim.format,
            server_region: detail.scrim.server_region,
            room_info: detail.scrim.room_info,
            notes: detail.scrim.notes,
          }}
        />
      </div>
    </div>
  );
}
