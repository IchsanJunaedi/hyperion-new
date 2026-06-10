"use client";

import { useState } from "react";
import { X, ArrowLeft, Shield, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import type { MetaHeroRating } from "../queries";

type Tier = "SS" | "S" | "A" | "B" | "C" | "D";

const TIER_STYLES: Record<Tier, { badge: string; label: string; border: string }> = {
  SS: { badge: "bg-violet-500/20 text-violet-300", label: "text-violet-300", border: "border-violet-500/40" },
  S: { badge: "bg-red-500/20 text-red-400", label: "text-red-400", border: "border-red-500/40" },
  A: { badge: "bg-orange-500/20 text-orange-400", label: "text-orange-400", border: "border-orange-500/40" },
  B: { badge: "bg-yellow-500/20 text-yellow-400", label: "text-yellow-400", border: "border-yellow-500/40" },
  C: { badge: "bg-green-500/20 text-green-400", label: "text-green-400", border: "border-green-500/40" },
  D: { badge: "bg-blue-500/20 text-blue-400", label: "text-blue-400", border: "border-blue-500/40" },
};

const ROLE_LABELS: Record<string, string> = {
  exp_lane: "EXP", jungler: "JGL", mid_lane: "MID", gold_lane: "GOLD", roamer: "ROAM",
};

const ROLE_COLORS: Record<string, string> = {
  exp_lane: "text-amber-400", jungler: "text-violet-400", mid_lane: "text-cyan-400",
  gold_lane: "text-yellow-400", roamer: "text-rose-400",
};

function HeroChip({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ui-border bg-ui-bg px-2 py-1 transition hover:border-white/20 hover:bg-ui-hover"
    >
      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getHeroImageUrl(name)}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <span className="text-xs text-ui-text">{name}</span>
    </button>
  );
}

interface HeroDetailPanelProps {
  hero: MetaHeroRating;
  allHeroes: MetaHeroRating[];
  onClose: () => void;
}

const HeroDetailPanel = ({ hero: initialHero, allHeroes, onClose }: HeroDetailPanelProps) => {
  const [navStack, setNavStack] = useState<MetaHeroRating[]>([]);

  const current: MetaHeroRating = navStack.length > 0 ? navStack[navStack.length - 1]! : initialHero;
  const isStub = !current.tier;
  const style = current.tier ? TIER_STYLES[current.tier as Tier] : null;
  const counters = current.counters ?? [];
  const synergies = current.synergies ?? [];

  function navigateTo(heroName: string) {
    const found = allHeroes.find((h) => h.hero_name === heroName);
    if (found) {
      setNavStack((prev) => [...prev, found]);
    } else {
      setNavStack((prev) => [...prev, { hero_name: heroName, tier: null } as unknown as MetaHeroRating]);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col overflow-hidden border-l border-ui-border bg-ui-surface shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-ui-border px-4 py-3">
          {navStack.length > 0 && (
            <button
              type="button"
              onClick={() => setNavStack((prev) => prev.slice(0, -1))}
              className="cursor-pointer text-ui-text-muted hover:text-ui-text"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className={cn("h-12 w-12 shrink-0 overflow-hidden rounded-xl border", style?.border ?? "border-ui-border")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getHeroImageUrl(current.hero_name)} alt={current.hero_name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ui-text">{current.hero_name}</p>
              {!isStub && (
                <div className="mt-0.5 flex items-center gap-2">
                  {current.tier && (
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-black", style?.badge)}>
                      {current.tier}
                    </span>
                  )}
                  {current.role_tag && (
                    <span className={cn("text-[10px] font-semibold", ROLE_COLORS[current.role_tag])}>
                      {ROLE_LABELS[current.role_tag]}
                    </span>
                  )}
                  {current.is_ban_priority && <Shield className="h-3 w-3 text-red-400" />}
                  {current.priority_to_learn && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                </div>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer text-ui-text-muted hover:text-ui-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="sidebar-scroll flex-1 overflow-y-auto">
          {isStub ? (
            <p className="p-6 text-center text-sm text-ui-text-muted">Hero ini belum ada di tier list patch ini</p>
          ) : (
            <div className="space-y-5 p-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-text-muted">Counters</p>
                {counters.length === 0 ? (
                  <p className="text-xs text-ui-text-muted">Belum ditambahkan</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {counters.map((name) => (
                      <HeroChip key={name} name={name} onClick={() => navigateTo(name)} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-text-muted">Synergies</p>
                {synergies.length === 0 ? (
                  <p className="text-xs text-ui-text-muted">Belum ditambahkan</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {synergies.map((name) => (
                      <HeroChip key={name} name={name} onClick={() => navigateTo(name)} />
                    ))}
                  </div>
                )}
              </div>

              {current.draft_notes && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ui-text-muted">Draft Notes</p>
                  <p className="text-sm leading-relaxed text-ui-text">{current.draft_notes}</p>
                </div>
              )}

              {current.notes && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ui-text-muted">Coach Notes</p>
                  <p className="text-sm italic leading-relaxed text-ui-text-2">{current.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export { HeroDetailPanel };
