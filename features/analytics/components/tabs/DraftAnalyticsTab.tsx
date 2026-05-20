import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ROLE_LABELS, ROLES } from "@/features/scrim/data/mlbb-heroes";
import type { DraftAnalyticsData, HeroStat } from "@/features/analytics/queries";

interface DraftAnalyticsTabProps {
  data: DraftAnalyticsData;
}

// Deterministic avatar colour
const AVATAR_COLOURS = [
  "bg-violet-500/20 text-violet-300",
  "bg-blue-500/20 text-blue-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-amber-500/20 text-amber-300",
  "bg-rose-500/20 text-rose-300",
  "bg-cyan-500/20 text-cyan-300",
  "bg-pink-500/20 text-pink-300",
];
function heroColour(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLOURS[h % AVATAR_COLOURS.length]!;
}

export function DraftAnalyticsTab({ data }: DraftAnalyticsTabProps) {
  const hasData = data.topOverall.length > 0;

  if (!hasData) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C] p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252525]">
          <FlaskConical className="h-6 w-6 text-[#6B6A68]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#E5E2E1]">Belum ada data draft</p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Isi draft hero saat selesaikan scrim untuk melihat analitik di sini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Overall */}
      <div className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
        <div className="border-b border-[#2D2D2D] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
            Most Picked (Our Side)
          </p>
        </div>
        <div className="divide-y divide-[#2D2D2D]">
          {data.topOverall.map((h, idx) => (
            <HeroRow key={h.hero_name} hero={h} rank={idx + 1} />
          ))}
        </div>
      </div>

      {/* Per Role */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ROLES.filter((r) => data.byRole[r]?.length).map((role) => (
          <div
            key={role}
            className="rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden"
          >
            <div className="border-b border-[#2D2D2D] px-4 py-3">
              <p className="text-xs font-semibold text-[#E5E2E1]">{ROLE_LABELS[role]}</p>
            </div>
            <div className="divide-y divide-[#2D2D2D]">
              {(data.byRole[role] ?? []).slice(0, 5).map((h, idx) => (
                <HeroRow key={h.hero_name} hero={h} rank={idx + 1} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroRow({
  hero,
  rank,
  compact = false,
}: {
  hero: HeroStat;
  rank: number;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        compact ? "px-4 py-2" : "px-5 py-2.5",
      )}
    >
      <span className="w-4 shrink-0 text-center text-[10px] font-bold text-[#6B6A68]">
        {rank}
      </span>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
          heroColour(hero.hero_name),
          compact ? "h-5 w-5" : "h-6 w-6 text-[10px]",
        )}
      >
        {hero.hero_name.slice(0, 2).toUpperCase()}
      </div>
      <span className="flex-1 truncate text-xs font-medium text-[#E5E2E1]">
        {hero.hero_name}
      </span>
      <span className="text-[11px] text-[#6B6A68]">{hero.picks}×</span>
      <span
        className={cn(
          "text-[11px] font-semibold",
          hero.winRate >= 50 ? "text-emerald-400" : "text-rose-400",
        )}
      >
        {hero.winRate}%
      </span>
    </div>
  );
}
