"use client";

import { useState } from "react";

import { StrategyNoteCard } from "./StrategyNoteCard";
import type { Database } from "@/types/database";

type StrategyNote = Database["public"]["Tables"]["strategy_notes"]["Row"];

interface StrategyNoteListWithFilterProps {
  notes: StrategyNote[];
  orgSlug: string;
}

export function StrategyNoteListWithFilter({
  notes,
  orgSlug,
}: StrategyNoteListWithFilterProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags)),
  ).sort();

  const filtered = activeTag
    ? notes.filter((n) => n.tags.includes(activeTag))
    : notes;

  return (
    <div className="space-y-4">
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              activeTag === null
                ? "bg-yellow-400 text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            Semua
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeTag === tag
                  ? "bg-yellow-400 text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/40">
          Tidak ada catatan dengan tag ini.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => (
            <StrategyNoteCard key={n.id} note={n} orgSlug={orgSlug} />
          ))}
        </div>
      )}
    </div>
  );
}
