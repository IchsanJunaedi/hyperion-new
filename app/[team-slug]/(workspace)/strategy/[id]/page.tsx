import { Eye, Lock, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getStrategyNote } from "@/features/strategy/queries";
import { StrategyNoteActions } from "@/features/strategy/components/StrategyNoteActions";

export const dynamic = "force-dynamic";

interface StrategyNoteDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

const VISIBILITY_LABELS: Record<string, { label: string; Icon: typeof Eye }> = {
  public: { label: "Semua member", Icon: Eye },
  division: { label: "Divisi saja", Icon: Users },
  private: { label: "Pribadi", Icon: Lock },
};

export default async function StrategyNoteDetailPage({
  params,
}: StrategyNoteDetailPageProps) {
  const { "team-slug": slug, id } = await params;
  const note = await getStrategyNote(id);
  if (!note) notFound();

  const date = new Date(note.updated_at).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  const vis = VISIBILITY_LABELS[note.visibility] ?? VISIBILITY_LABELS["division"];
  const VisIcon = vis.Icon;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-2">
        <Link
          href={`/${slug}/strategy`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Bank Strategi
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/60">
            <VisIcon className="h-3 w-3" />
            {vis.label}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white">{note.title}</h1>
        <p className="text-xs text-white/50">Diperbarui {date}</p>
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <article className="max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <div className="whitespace-pre-line font-mono text-sm leading-relaxed text-white/85">
          {note.content}
        </div>
      </article>

      <StrategyNoteActions orgSlug={slug} noteId={note.id} />
    </div>
  );
}
