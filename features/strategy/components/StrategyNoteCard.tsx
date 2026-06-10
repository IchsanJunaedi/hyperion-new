import { Lightbulb } from "lucide-react";
import Link from "next/link";

import type { Database } from "@/types/database";

type StrategyNote = Database["public"]["Tables"]["strategy_notes"]["Row"];

interface StrategyNoteCardProps {
  note: StrategyNote;
  orgSlug: string;
}

const StrategyNoteCard = ({ note, orgSlug }: StrategyNoteCardProps) => {
  const date = new Date(note.updated_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <Link
      href={`/${orgSlug}/strategy/${note.id}`}
      className="block rounded-xl border border-white/10 bg-zinc-900/40 p-5 transition hover:border-white/20 hover:bg-zinc-900/60"
    >
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
        <h3 className="line-clamp-1 text-sm font-semibold text-ui-text">
          {note.title}
        </h3>
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-ui-text-2">
        {note.content}
      </p>
      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {note.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-ui-text-2"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-ui-text-muted">Diperbarui {date}</p>
    </Link>
  );
};
export { StrategyNoteCard };
