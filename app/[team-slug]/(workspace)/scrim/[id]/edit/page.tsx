import { ArrowLeft } from "lucide-react";
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

  if (detail.scrim.status === "completed" || detail.scrim.status === "cancelled") {
    redirect(`/${slug}/scrim/${id}`);
  }

  const { divisions } = await getPublicTeamData(organization);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      {/* Pill Back Button */}
      <div className="flex justify-start">
        <Link
          href={`/${slug}/scrim/${id}`}
          className="group inline-flex items-center gap-2 rounded-full border border-ui-border bg-ui-surface/40 px-3.5 py-1.5 text-xs font-semibold text-ui-text-2 transition-all duration-300 hover:bg-ui-elevated/60 hover:text-ui-text"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke detail scrim
        </Link>
      </div>

      {/* Centered title & card */}
      <div className="mx-auto max-w-2xl w-full space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight text-left">
            Edit Scrim
          </h1>
          <p className="text-sm text-ui-text-2">
            vs {detail.scrim.opponent_name}
          </p>
        </div>

        <div className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5 sm:p-6 w-full shadow-xl shadow-black/20">
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
    </div>
  );
}
