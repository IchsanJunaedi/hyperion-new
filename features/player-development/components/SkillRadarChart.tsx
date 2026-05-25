"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { PlayerTargetWithHistory } from "../queries";

interface SkillRadarChartProps {
  targets: PlayerTargetWithHistory[];
}

export function SkillRadarChart({ targets }: SkillRadarChartProps) {
  if (targets.length < 3) return null;

  const data = targets.map((t) => ({
    skill: t.skill_name.length > 10 ? t.skill_name.slice(0, 10) + "…" : t.skill_name,
    current: t.current_level,
    target: t.target_level,
  }));

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Skill Radar</h2>
        <div className="flex items-center gap-3 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500/60" />
            Saat ini
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-purple-500/40" />
            Target
          </span>
        </div>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
            />
            <Radar
              name="Target"
              dataKey="target"
              stroke="rgba(168,85,247,0.5)"
              fill="rgba(168,85,247,0.08)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
            <Radar
              name="Saat ini"
              dataKey="current"
              stroke="rgba(59,130,246,0.9)"
              fill="rgba(59,130,246,0.2)"
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
