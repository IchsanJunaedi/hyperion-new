import { Lightbulb, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StrategyNoteListWithFilter } from "@/features/strategy/components/StrategyNoteListWithFilter";
import { listStrategyNotes } from "@/features/strategy/queries";
import { getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface StrategyPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function StrategyPage({ params }: StrategyPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const notes = await listStrategyNotes(organization.id);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ui-text sm:text-3xl">
            Bank Strategi
          </h1>
        </div>
        <Link
          href={`/${slug}/strategy/new`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" />
          Tulis catatan
        </Link>
      </header>

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-white/35" />
          <p className="mt-3 text-sm text-white/65">
            Belum ada catatan strategi.
          </p>
          <Link
            href={`/${slug}/strategy/new`}
            className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-ui-text transition hover:bg-white/5"
          >
            Tulis catatan pertama
          </Link>
        </div>
      ) : (
        <StrategyNoteListWithFilter notes={notes} orgSlug={slug} />
      )}
    </div>
  );
}
