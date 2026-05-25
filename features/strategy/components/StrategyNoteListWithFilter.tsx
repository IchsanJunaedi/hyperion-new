"use client";

import { useState } from "react";
import { BookOpen, LayoutGrid, Lightbulb } from "lucide-react";
import Link from "next/link";

import { StrategyNoteCard } from "./StrategyNoteCard";
import { cn } from "@/lib/utils/cn";
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
  const [viewMode, setViewMode] = useState<"grid" | "playbook">("grid");

  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags)),
  ).sort();

  const filtered = activeTag
    ? notes.filter((n) => n.tags.includes(activeTag))
    : notes;

  if (viewMode === "playbook") {
    const taggedNotes = new Map<string, StrategyNote[]>();
    const untagged: StrategyNote[] = [];
    for (const note of notes) {
      if (note.tags.length === 0) {
        untagged.push(note);
      } else {
        for (const tag of note.tags) {
          if (!taggedNotes.has(tag)) taggedNotes.set(tag, []);
          taggedNotes.get(tag)!.push(note);
        }
      }
    }
    const chapters: Array<{ tag: string; notes: StrategyNote[] }> = [];
    for (const tag of Array.from(taggedNotes.keys()).sort()) {
      chapters.push({ tag, notes: taggedNotes.get(tag)! });
    }
    if (untagged.length > 0) chapters.push({ tag: "Umum", notes: untagged });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
        </div>
        {chapters.map(({ tag, notes: chapterNotes }, i) => (
          <div key={tag} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-400/15 text-[10px] font-bold text-yellow-400">
                {i + 1}
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">{tag}</h3>
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[10px] text-white/30">{chapterNotes.length} catatan</span>
            </div>
            <div className="space-y-2 pl-9">
              {chapterNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/${orgSlug}/strategy/${note.id}`}
                  className="group flex items-start gap-3 rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-3 transition hover:border-white/15 hover:bg-zinc-900/50"
                >
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400/60 group-hover:text-yellow-400 transition" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/85 group-hover:text-white transition">{note.title}</p>
                    {note.content && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-white/40">{note.content}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-white/25 group-hover:text-white/40 transition">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {allTags.length > 0 && (
          <>
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
          </>
        )}
        <div className="ml-auto">
          <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
        </div>
      </div>

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

function ViewToggle({
  viewMode,
  onToggle,
}: {
  viewMode: "grid" | "playbook";
  onToggle: (v: "grid" | "playbook") => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-white/10 p-0.5">
      <button
        type="button"
        onClick={() => onToggle("grid")}
        title="Tampilan Grid"
        className={cn(
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition",
          viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onToggle("playbook")}
        title="Playbook"
        className={cn(
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition",
          viewMode === "playbook" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70",
        )}
      >
        <BookOpen className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
