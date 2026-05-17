"use client";

import { Eye, Shield, Swords, Target } from "lucide-react";

import type { OpponentProfile } from "@/features/scouting/queries";

interface ScoutingCardProps {
  profile: OpponentProfile;
}

export function ScoutingCard({ profile }: ScoutingCardProps) {
  const data = (profile.data ?? {}) as Record<string, unknown>;
  const heroPool = (data.hero_pool as string[]) ?? [];

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-orange-400" />
        <h3 className="text-sm font-medium text-[#E5E2E1]">{profile.opponent_name}</h3>
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        {!!data.high_rank && (
          <div>
            <span className="text-[#6B6A68]">High Rank:</span>{" "}
            <span className="text-[#E5E2E1]">{data.high_rank as string}</span>
          </div>
        )}
        {!!data.current_rank && (
          <div>
            <span className="text-[#6B6A68]">Current Rank:</span>{" "}
            <span className="text-[#E5E2E1]">{data.current_rank as string}</span>
          </div>
        )}
      </div>

      {heroPool.length > 0 && (
        <div>
          <span className="text-[10px] text-[#6B6A68] uppercase tracking-wide">Hero Pool</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {heroPool.map((hero) => (
              <span key={hero} className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-[10px] text-[#9B9A97]">
                {hero}
              </span>
            ))}
          </div>
        </div>
      )}

      {!!data.playstyle && (
        <div>
          <div className="flex items-center gap-1 text-[10px] text-[#6B6A68] uppercase tracking-wide">
            <Swords className="h-3 w-3" />
            Playstyle
          </div>
          <p className="mt-0.5 text-xs text-[#9B9A97]">{data.playstyle as string}</p>
        </div>
      )}

      {!!data.weaknesses && (
        <div>
          <div className="flex items-center gap-1 text-[10px] text-[#6B6A68] uppercase tracking-wide">
            <Target className="h-3 w-3" />
            Kelemahan
          </div>
          <p className="mt-0.5 text-xs text-[#9B9A97]">{data.weaknesses as string}</p>
        </div>
      )}

      {!!data.notes && (
        <p className="text-xs text-[#6B6A68] border-t border-[#2D2D2D] pt-2">
          {data.notes as string}
        </p>
      )}
    </div>
  );
}
