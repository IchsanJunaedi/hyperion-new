"use client";

import { useState, useRef, useEffect } from "react";
import { Ban, ChevronDown, Plus, Search, User, X } from "lucide-react";
import { HeroPicker } from "./HeroPicker";
import { MLBB_HEROES, ROLES, ROLE_LABELS, getHeroImageUrl, type RoleName } from "@/features/scrim/data/mlbb-heroes";
import { cn } from "@/lib/utils/cn";

const BAN_COUNT = 5;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OurDraftSlot {
  hero: string;
  playerId: string | null;
}

export interface DraftPicks {
  our: Record<RoleName, OurDraftSlot>;
  enemy: Record<RoleName, string>;
  bans: {
    our: string[];   // length 5
    enemy: string[]; // length 5
  };
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
    bans: {
      our:   Array(BAN_COUNT).fill(""),
      enemy: Array(BAN_COUNT).fill(""),
    },
  };
}

// ─── Ban Slot Picker — circular trigger + dropdown ────────────────────────────

function BanSlotPicker({
  value,
  onChange,
  excludedHeroes,
}: {
  value: string;
  onChange: (hero: string) => void;
  excludedHeroes: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const available = MLBB_HEROES.filter((h) => !excludedHeroes.has(h));
  const filtered = query.trim()
    ? available.filter((h) => h.toLowerCase().includes(query.toLowerCase()))
    : available;

  return (
    <div ref={ref} className="relative">
      {/* Circular trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={value || "Pilih hero ban"}
        className={cn(
          "group relative h-9 w-9 overflow-hidden rounded-full border-2 transition-all",
          value
            ? "border-red-500/60 hover:border-red-400"
            : open
            ? "border-[#5D5D5D] bg-[#1a1a1a]"
            : "border-dashed border-[#3D3D3D] bg-[#141414] hover:border-[#5D5D5D]",
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getHeroImageUrl(value)} alt={value} className="h-full w-full object-cover" />
            {/* Hover overlay to clear */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
            >
              <X className="h-3.5 w-3.5 text-red-400" />
            </div>
          </>
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[#3D3D3D] group-hover:text-[#5D5D5D]">
            <Plus className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-1/2 top-[calc(100%+6px)] z-50 w-44 -translate-x-1/2 overflow-hidden rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] shadow-2xl shadow-black/60">
          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="flex w-full items-center gap-2 border-b border-[#2D2D2D] px-3 py-1.5 text-[10px] text-rose-400 transition-colors hover:bg-[#252525]"
            >
              <X className="h-3 w-3" />
              Hapus ban
            </button>
          )}
          <div className="flex items-center gap-2 border-b border-[#2D2D2D] px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#6B6A68]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari hero…"
              className="flex-1 bg-transparent text-xs text-[#E5E2E1] outline-none placeholder:text-[#6B6A68]"
            />
          </div>
          <ul className="sidebar-scroll max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs text-[#6B6A68]">Tidak ditemukan</li>
            ) : (
              filtered.map((hero) => (
                <li key={hero}>
                  <button
                    type="button"
                    onClick={() => { onChange(hero); setOpen(false); }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-xs transition-colors hover:bg-[#252525]",
                      hero === value ? "bg-red-500/10 text-red-300" : "text-[#E5E2E1]",
                    )}
                  >
                    <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getHeroImageUrl(hero)} alt={hero} className="h-full w-full object-cover" />
                    </div>
                    <span className="truncate">{hero}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
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
  onBanChange: (side: "our" | "enemy", index: number, hero: string) => void;
}

export function DraftSection({ draft, attendingPlayers, onOurChange, onEnemyChange, onBanChange }: DraftSectionProps) {
  const allPicked = new Set<string>();
  for (const slot of Object.values(draft.our)) if (slot.hero) allPicked.add(slot.hero);
  for (const hero of Object.values(draft.enemy)) if (hero) allPicked.add(hero);
  for (const hero of [...(draft.bans?.our ?? []), ...(draft.bans?.enemy ?? [])]) if (hero) allPicked.add(hero);

  function getExcluded(currentHero: string): Set<string> {
    const ex = new Set(allPicked);
    if (currentHero) ex.delete(currentHero);
    return ex;
  }

  const roleToPlayer = new Map(
    attendingPlayers.filter((p) => p.mainRole).map((p) => [p.mainRole!, p]),
  );

  function handleOurHero(role: RoleName, newHero: string) {
    const slot = draft.our[role];
    let newPlayerId = slot.playerId;
    if (newHero === "") {
      newPlayerId = null;
    } else if (!newPlayerId) {
      newPlayerId = roleToPlayer.get(role)?.userId ?? null;
    }
    onOurChange(role, newHero, newPlayerId);
  }

  const playerById = new Map(attendingPlayers.map((p) => [p.userId, p]));
  const bansOur = draft.bans?.our ?? Array(BAN_COUNT).fill("");
  const bansEnemy = draft.bans?.enemy ?? Array(BAN_COUNT).fill("");

  return (
    <div className="space-y-4">
      {/* ── Ban Hero — horizontal circles ────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Ban className="h-3 w-3 text-[#6B6A68]" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Ban Hero</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {bansOur.map((hero, i) => (
              <BanSlotPicker
                key={i}
                value={hero}
                onChange={(h) => onBanChange("our", i, h)}
                excludedHeroes={getExcluded(hero)}
              />
            ))}
          </div>
          <div className="flex flex-col items-center gap-0.5 px-1">
            <span className="text-[9px] font-semibold text-emerald-400">Our</span>
            <div className="h-3 w-px bg-[#3D3D3D]" />
            <span className="text-[9px] font-semibold text-rose-400">Enemy</span>
          </div>
          <div className="flex gap-1.5">
            {bansEnemy.map((hero, i) => (
              <BanSlotPicker
                key={i}
                value={hero}
                onChange={(h) => onBanChange("enemy", i, h)}
                excludedHeroes={getExcluded(hero)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Draft ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">Draft</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Our Draft */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-emerald-400">Our Draft</p>
            {ROLES.map((role) => {
              const slot = draft.our[role];
              const assignedPlayer = slot.playerId ? playerById.get(slot.playerId) : null;
              const slotLabel = assignedPlayer?.displayName
                ? `${assignedPlayer.displayName} - ${ROLE_LABELS[role]}`
                : ROLE_LABELS[role];
              return (
                <div key={role}>
                  <p className="mb-0.5 truncate text-[10px] text-[#6B6A68]" title={slotLabel}>
                    {slotLabel}
                  </p>
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
    </div>
  );
}
