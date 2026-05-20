"use client";

import { HeroPicker } from "./HeroPicker";
import { ROLES, ROLE_LABELS, type RoleName } from "@/features/scrim/data/mlbb-heroes";

export interface DraftPicks {
  our: Record<RoleName, string>;
  enemy: Record<RoleName, string>;
}

export function makeBlankDraft(): DraftPicks {
  return {
    our:   { exp_lane: "", jungler: "", mid_lane: "", gold_lane: "", roamer: "" },
    enemy: { exp_lane: "", jungler: "", mid_lane: "", gold_lane: "", roamer: "" },
  };
}

interface DraftSectionProps {
  draft: DraftPicks;
  onChange: (side: "our" | "enemy", role: RoleName, hero: string) => void;
}

export function DraftSection({ draft, onChange }: DraftSectionProps) {
  const allPicked = new Set<string>();
  for (const hero of Object.values(draft.our)) if (hero) allPicked.add(hero);
  for (const hero of Object.values(draft.enemy)) if (hero) allPicked.add(hero);

  function getExcluded(currentValue: string): Set<string> {
    const excluded = new Set(allPicked);
    if (currentValue) excluded.delete(currentValue);
    return excluded;
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">
        Draft
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Our Draft */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-emerald-400">Our Draft</p>
          {ROLES.map((role) => (
            <div key={role} className="space-y-0.5">
              <p className="text-[10px] text-[#6B6A68]">{ROLE_LABELS[role]}</p>
              <HeroPicker
                value={draft.our[role]}
                onChange={(hero) => onChange("our", role, hero)}
                excludedHeroes={getExcluded(draft.our[role])}
              />
            </div>
          ))}
        </div>

        {/* Enemy Draft */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-rose-400">Enemy Draft</p>
          {ROLES.map((role) => (
            <div key={role} className="space-y-0.5">
              <p className="text-[10px] text-[#6B6A68]">{ROLE_LABELS[role]}</p>
              <HeroPicker
                value={draft.enemy[role]}
                onChange={(hero) => onChange("enemy", role, hero)}
                excludedHeroes={getExcluded(draft.enemy[role])}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
