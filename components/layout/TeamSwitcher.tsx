"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface ManagedTeam {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
}

interface TeamSwitcherProps {
  teams: ManagedTeam[];
  currentSlug: string;
}

const TeamSwitcher = ({ teams, currentSlug }: TeamSwitcherProps) => {
  const [open, setOpen] = useState(false);

  if (teams.length <= 1) return null;

  const current: ManagedTeam =
    teams.find((t) => t.slug === currentSlug) ?? teams[0]!;

  return (
    <div className="relative px-3 pt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-ui-text-2 transition hover:bg-ui-hover"
      >
        <div className="flex min-w-0 items-center gap-2">
          {current.logoUrl ? (
            <Image
              src={current.logoUrl}
              alt={current.name}
              width={16}
              height={16}
              className="h-4 w-4 rounded object-cover"
            />
          ) : (
            <div className="grid h-4 w-4 shrink-0 place-items-center rounded bg-ui-hover-strong text-[9px] font-bold text-ui-text-dim">
              {current.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="truncate text-ui-text-dim">{current.name}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="absolute left-3 right-3 z-50 mt-1 rounded border border-ui-border bg-ui-surface p-1 text-sm shadow-lg">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/manage/${team.slug}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded px-3 py-1.5 transition hover:bg-ui-hover ${
                  team.slug === currentSlug
                    ? "bg-ui-hover text-ui-text-dim"
                    : "text-ui-text-2 hover:text-ui-text-dim"
                }`}
              >
                {team.logoUrl ? (
                  <Image
                    src={team.logoUrl}
                    alt={team.name}
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 rounded object-cover"
                  />
                ) : (
                  <div className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded bg-ui-hover-strong text-[8px] font-bold text-ui-text-dim">
                    {team.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="truncate">{team.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export { TeamSwitcher };
