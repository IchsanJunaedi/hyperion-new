"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, User } from "lucide-react";
import { HeroPicker } from "./HeroPicker";
import { ROLES, ROLE_LABELS, type RoleName } from "@/features/scrim/data/mlbb-heroes";
import { cn } from "@/lib/utils/cn";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OurDraftSlot {
  hero: string;
  playerId: string | null;
}

export interface DraftPicks {
  our: Record<RoleName, OurDraftSlot>;
  enemy: Record<RoleName, string>;
}

export interface AttendingPlayer {
  userId: string;
  displayName: string | null;
  mainRole: string | null;
}

export function makeBlankDraft(): DraftPicks {
  const blankSlot = (): OurDraftSlot => ({ hero: "", playerId: null });
  return {
    our: {
      exp_lane:  blankSlot(),
      jungler:   blankSlot(),
      mid_lane:  blankSlot(),
      gold_lane: blankSlot(),
      roamer:    blankSlot(),
    },
    enemy: { exp_lane: "", jungler: "", mid_lane: "", gold_lane: "", roamer: "" },
  };
}

// ─── Player Dropdown (custom, no native <select>) ─────────────────────────────

function PlayerDropdown({
  playerId,
  players,
  roleHint,
  onChange,
}: {
  playerId: string | null;
  players: AttendingPlayer[];
  roleHint: RoleName;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const selected = players.find((p) => p.userId === playerId);

  return (
    <div ref={ref} className="relative mt-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-6 w-full cursor-pointer items-center gap-1.5 rounded px-1.5 text-[10px] transition-colors",
          selected
            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
            : "bg-[#1a1a1a] border border-[#2D2D2D] text-[#6B6A68] hover:border-[#3D3D3D]",
        )}
      >
        <User className="h-2.5 w-2.5 shrink-0" />
        <span className="flex-1 truncate text-left">
          {selected ? (selected.displayName ?? "Unknown") : "— Pilih pemain —"}
        </span>
        <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-0.5 overflow-hidden rounded-lg border border-[#2D2D2D] bg-[#1C1C1C] shadow-xl shadow-black/60">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className="flex w-full px-2 py-1.5 text-[10px] text-[#6B6A68] hover:bg-[#252525] transition-colors"
          >
            — Tidak ada —
          </button>
          {players.map((p) => (
            <button
              key={p.userId}
              type="button"
              onClick={() => { onChange(p.userId); setOpen(false); }}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-2 py-1.5 text-[10px] transition-colors hover:bg-[#252525]",
                p.userId === playerId ? "bg-emerald-500/10 text-emerald-300" : "text-[#E5E2E1]",
              )}
            >
              <span className="truncate">{p.displayName ?? "Unknown"}</span>
              {p.mainRole === roleHint && (
                <span className="shrink-0 rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] text-emerald-400">
                  Main
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DraftSection ─────────────────────────────────────────────────────────────

interface DraftSectionProps {
  draft: DraftPicks;
  attendingPlayers: AttendingPlayer[];
  onOurChange: (role: RoleName, hero: string, playerId: string | null) => void;
  onEnemyChange: (role: RoleName, hero: string) => void;
}

export function DraftSection({ draft, attendingPlayers, onOurChange, onEnemyChange }: DraftSectionProps) {
  // Build all-picked set for hero exclusion
  const allPicked = new Set<string>();
  for (const slot of Object.values(draft.our)) if (slot.hero) allPicked.add(slot.hero);
  for (const hero of Object.values(draft.enemy)) if (hero) allPicked.add(hero);

  function getExcluded(currentHero: string): Set<string> {
    const ex = new Set(allPicked);
    if (currentHero) ex.delete(currentHero);
    return ex;
  }

  // Role → attending player map (for auto-assign)
  const roleToPlayer = new Map(
    attendingPlayers
      .filter((p) => p.mainRole)
      .map((p) => [p.mainRole!, p]),
  );

  function handleOurHero(role: RoleName, newHero: string) {
    const slot = draft.our[role];
    let newPlayerId = slot.playerId;
    if (newHero === "") {
      newPlayerId = null;
    } else if (!newPlayerId) {
      // Auto-assign if slot has no player yet
      newPlayerId = roleToPlayer.get(role)?.userId ?? null;
    }
    onOurChange(role, newHero, newPlayerId);
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Draft</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Our Draft */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-emerald-400">Our Draft</p>
          {ROLES.map((role) => {
            const slot = draft.our[role];
            return (
              <div key={role}>
                <p className="mb-0.5 text-[10px] text-[#6B6A68]">{ROLE_LABELS[role]}</p>
                <HeroPicker
                  value={slot.hero}
                  onChange={(hero) => handleOurHero(role, hero)}
                  excludedHeroes={getExcluded(slot.hero)}
                />
                {attendingPlayers.length > 0 && (
                  <PlayerDropdown
                    playerId={slot.playerId}
                    players={attendingPlayers}
                    roleHint={role}
                    onChange={(id) => onOurChange(role, slot.hero, id)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Enemy Draft */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-rose-400">Enemy Draft</p>
          {ROLES.map((role) => (
            <div key={role}>
              <p className="mb-0.5 text-[10px] text-[#6B6A68]">{ROLE_LABELS[role]}</p>
              <HeroPicker
                value={draft.enemy[role]}
                onChange={(hero) => onEnemyChange(role, hero)}
                excludedHeroes={getExcluded(draft.enemy[role])}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
