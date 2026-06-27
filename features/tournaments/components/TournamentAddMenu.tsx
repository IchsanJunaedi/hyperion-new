"use client";

import { ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface TournamentAddMenuProps {
  orgs: Array<{ slug: string; name: string }>;
}

const TournamentAddMenu = ({ orgs }: TournamentAddMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (orgs.length === 0) return null;

  // Single team: direct link, no dropdown.
  if (orgs.length === 1) {
    const first = orgs[0];
    if (!first) return null;
    return (
      <Link
        href={`/${first.slug}/tournaments/new`}
        className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium bg-ui-hover text-ui-text-dim border border-ui-border transition hover:bg-ui-hover-strong hover:text-ui-text cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Tambah
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium bg-ui-hover text-ui-text-dim border border-ui-border transition hover:bg-ui-hover-strong hover:text-ui-text cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Tambah
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-ui-border bg-ui-surface py-1 shadow-xl">
          <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-ui-text-muted">
            Pilih tim
          </p>
          {orgs.map((org) => (
            <Link
              key={org.slug}
              href={`/${org.slug}/tournaments/new`}
              onClick={() => setOpen(false)}
              className="flex w-full items-center px-3 py-2 text-sm text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text"
            >
              {org.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export { TournamentAddMenu };
