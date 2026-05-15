import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { getScrimDetail } from "@/features/scrim/queries";
import { getCurrentUserRole } from "@/features/roster/queries";
import { FinishScrimForm } from "@/features/scrim/components/FinishScrimForm";

export const dynamic = "force-dynamic";

const FORMAT_GAMES: Record<string, number> = {
  bo1: 1,
  bo2: 2,
  bo3: 3,
  bo5: 5,
  bo7: 7,
  scrimmage: 1,
};

interface FinishScrimPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function FinishScrimPage({ params }: FinishScrimPageProps) {
  const { "team-slug": slug, id } = await params;
  const detail = await getScrimDetail(id);
  if (!detail) notFound();

  const { scrim } = detail;

  // Only captain+ can finish
  const currentUserRole = await getCurrentUserRole(scrim.organization_id);
  const canFinish = ["captain", "manager", "owner"].includes(currentUserRole ?? "");
  if (!canFinish) redirect(`/${slug}/scrim/${id}`);

  // Can't finish if already completed/cancelled
  if (scrim.status === "completed" || scrim.status === "cancelled") {
    redirect(`/${slug}/scrim/${id}`);
  }

  const totalGames = FORMAT_GAMES[scrim.format] ?? 1;

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
          Selesai Pertandingan
        </h1>
        <p className="text-sm text-white/65">
          vs {scrim.opponent_name} · {scrim.format.toUpperCase()} · {totalGames} game
        </p>
      </header>

      <FinishScrimForm
        scrimId={scrim.id}
        orgSlug={slug}
        orgId={scrim.organization_id}
        totalGames={totalGames}
        format={scrim.format}
      />
    </div>
  );
}
