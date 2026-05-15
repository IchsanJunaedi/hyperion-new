import Link from "next/link";
import { notFound } from "next/navigation";

import { StrategyNoteForm } from "@/features/strategy/components/StrategyNoteForm";
import { getOrgBySlug, getPublicTeamData } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface NewStrategyNotePageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function NewStrategyNotePage({
  params,
}: NewStrategyNotePageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const { divisions } = await getPublicTeamData(organization);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-1">
        <Link
          href={`/${slug}/strategy`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Kembali ke bank strategi
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Tulis catatan strategi
        </h1>
        <p className="text-sm text-white/65">
          Simpan draft pick, analisis lawan, atau catatan taktik. Bisa diatur
          visibilitasnya per divisi atau pribadi.
        </p>
      </header>

      <div className="max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <StrategyNoteForm
          orgSlug={slug}
          divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
        />
      </div>
    </div>
  );
}
