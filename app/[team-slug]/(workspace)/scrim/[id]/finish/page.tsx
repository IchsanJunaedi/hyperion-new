import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getScrimDetail } from "@/features/scrim/queries";
import { getCurrentUserRole } from "@/features/roster/queries";
import { FinishScrimForm } from "@/features/scrim/components/FinishScrimForm";

export const dynamic = "force-dynamic";

interface FinishScrimPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function FinishScrimPage({ params }: FinishScrimPageProps) {
  const { "team-slug": slug, id } = await params;
  const detail = await getScrimDetail(id);
  if (!detail) notFound();

  const { scrim } = detail;

  const currentUserRole = await getCurrentUserRole(scrim.organization_id);
  const canFinish = ["captain", "manager", "owner"].includes(currentUserRole ?? "");
  if (!canFinish) redirect(`/${slug}/scrim/${id}`);

  if (scrim.status === "completed" || scrim.status === "cancelled") {
    redirect(`/${slug}/scrim/${id}`);
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      {/* Back button — same pill style as calendar */}
      <div className="flex justify-start">
        <Link
          href={`/${slug}/scrim/${id}`}
          className="group inline-flex items-center gap-2 rounded-full border border-ui-border bg-ui-surface/40 px-3.5 py-1.5 text-xs font-semibold text-ui-text-2 transition-all duration-300 hover:bg-ui-elevated/60 hover:text-ui-text"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke detail scrim
        </Link>
      </div>

      {/* Centered title */}
      <div className="mx-auto max-w-2xl w-full space-y-1">
        <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight">
          Selesai Pertandingan
        </h1>
        <p className="text-sm text-ui-text-2">
          vs {scrim.opponent_name} · {scrim.format.toUpperCase()}
        </p>
      </div>

      <FinishScrimForm
        scrimId={scrim.id}
        orgSlug={slug}
        orgId={scrim.organization_id}
        format={scrim.format}
      />
    </div>
  );
}
