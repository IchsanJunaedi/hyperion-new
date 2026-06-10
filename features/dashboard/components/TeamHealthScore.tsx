import { Activity } from "lucide-react";
import type { HealthScoreBreakdown } from "@/features/dashboard/queries/healthScore";

interface TeamHealthScoreProps {
  score: HealthScoreBreakdown;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-ui-border overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

const TeamHealthScore = ({ score }: TeamHealthScoreProps) => {
  const totalColor =
    score.total >= 75 ? "text-green-400" :
    score.total >= 50 ? "text-yellow-400" : "text-red-400";

  const barColor =
    score.total >= 75 ? "bg-green-400" :
    score.total >= 50 ? "bg-yellow-400" : "bg-red-400";

  const metrics = [
    { label: "Win Rate", value: score.winRate, weight: "40%", color: "bg-emerald-400" },
    { label: "Attendance", value: score.attendanceRate, weight: "30%", color: "bg-blue-400" },
    { label: "Availability", value: score.availabilityRatio, weight: "20%", color: "bg-purple-400" },
    { label: "Activity (30d)", value: score.activityScore, weight: "10%", color: "bg-orange-400" },
  ];

  return (
    <div className="border border-ui-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ui-text flex items-center gap-2">
          <Activity className="h-4 w-4 text-ui-text-2" />
          Team Health Score
        </h2>
        <span className={`text-3xl font-bold ${totalColor}`}>
          {score.total}<span className="text-base font-normal text-ui-text-2">/100</span>
        </span>
      </div>

      <div className="space-y-1">
        <ScoreBar value={score.total} color={barColor} />
      </div>

      <div className="space-y-3 pt-2 border-t border-ui-border">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-ui-text-2">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-ui-text-muted">×{m.weight}</span>
                <span className="text-ui-text font-medium">{m.value}%</span>
              </div>
            </div>
            <ScoreBar value={m.value} color={m.color} />
          </div>
        ))}
      </div>
    </div>
  );
};
export { TeamHealthScore };
