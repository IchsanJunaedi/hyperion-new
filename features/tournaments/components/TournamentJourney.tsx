"use client";

import { cn } from "@/lib/utils/cn";
import type { TournamentStageWithMatches, TournamentMatch, TournamentGameResult } from "../queries";

interface TournamentJourneyProps {
  stages: TournamentStageWithMatches[];
  tournamentName: string;
}

function getMatchStatus(match: TournamentMatch): "win" | "loss" | "draw" | "pending" {
  if (match.is_win === true) return "win";
  if (match.is_win === false) return "loss";
  
  const games = match.game_results ?? [];
  if (games.length === 0) return "pending";
  
  const w = games.filter((g: TournamentGameResult) => g.is_win === true).length;
  const l = games.filter((g: TournamentGameResult) => g.is_win === false).length;
  
  if (w > l) return "win";
  if (l > w) return "loss";
  return "draw";
}

function stageResult(stage: TournamentStageWithMatches): "win" | "loss" | "draw" | "pending" {
  const matchStatuses = stage.matches.map(getMatchStatus);
  const wins = matchStatuses.filter((s) => s === "win").length;
  const losses = matchStatuses.filter((s) => s === "loss").length;
  
  if (stage.matches.length === 0 || (!stage.is_completed && wins === 0 && losses === 0)) return "pending";
  if (wins > losses) return "win";
  if (losses > wins) return "loss";
  return "draw";
}

const TournamentJourney = ({ stages, tournamentName }: TournamentJourneyProps) => {
  if (stages.length === 0) return null;

  const sortedStages = [...stages].sort((a, b) => {
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });

  const totalWins = sortedStages.reduce((sum, s) => sum + s.matches.map(getMatchStatus).filter((status) => status === "win").length, 0);
  const totalLosses = sortedStages.reduce((sum, s) => sum + s.matches.map(getMatchStatus).filter((status) => status === "loss").length, 0);
  const completedStages = sortedStages.filter((s) => s.is_completed).length;

  const lastEliminated = sortedStages.findLast((s) => {
    const res = stageResult(s);
    return res === "loss" && s.is_completed;
  });

  return (
    <div className="space-y-4">
      {/* Summary pill row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {completedStages > 0 && (
          <span className="rounded-full bg-ui-elevated px-2.5 py-1 text-ui-text-2">
            {completedStages}/{sortedStages.length} tahap selesai
          </span>
        )}
        {(totalWins + totalLosses) > 0 && (
          <>
            <span className="rounded-full bg-green-500/10 px-2.5 py-1 font-semibold text-green-400">
              {totalWins}W
            </span>
            <span className="rounded-full bg-red-500/10 px-2.5 py-1 font-semibold text-red-400">
              {totalLosses}L
            </span>
          </>
        )}
        {lastEliminated && (
          <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-orange-400">
            Terakhir: {lastEliminated.stage_name}
          </span>
        )}
      </div>

      {/* Journey cards */}
      <div className="flex flex-wrap items-center gap-1">
        {sortedStages.map((stage, i) => {
          const result = stageResult(stage);
          const matchStatuses = stage.matches.map(getMatchStatus);
          const wins = matchStatuses.filter((s) => s === "win").length;
          const losses = matchStatuses.filter((s) => s === "loss").length;
          return (
            <div key={stage.id} className="flex items-center gap-1">
              <div
                className={cn(
                  "relative flex min-w-[80px] flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-center",
                  result === "win" && "border-green-500/30 bg-green-500/5",
                  result === "loss" && "border-red-500/30 bg-red-500/5",
                  result === "draw" && "border-yellow-500/30 bg-yellow-500/5",
                  result === "pending" && "border-ui-border bg-white/[0.02]",
                )}
              >
                {/* Stage label */}
                <p className="max-w-[90px] truncate text-[10px] font-medium text-ui-text-2">
                  {stage.stage_name}
                </p>

                {/* Result indicator */}
                {result !== "pending" ? (
                  <div className="flex items-center gap-1">
                    {wins > 0 && (
                      <span className="text-xs font-bold text-green-400">{wins}W</span>
                    )}
                    {losses > 0 && (
                      <span className="text-xs font-bold text-red-400">{losses}L</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-ui-text-muted">—</span>
                )}

                {/* Result dot */}
                <div className={cn(
                  "absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full",
                  result === "win" && "bg-green-500",
                  result === "loss" && "bg-red-500",
                  result === "draw" && "bg-yellow-500",
                  result === "pending" && "bg-white/15",
                )} />
              </div>

              {/* Arrow connector */}
              {i < sortedStages.length - 1 && (
                <span className="text-[10px] text-ui-text-muted">→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Final verdict */}
      {completedStages === stages.length && stages.length > 0 && (
        <div className={cn(
          "rounded-xl border px-4 py-2.5 text-center text-xs font-semibold",
          totalWins >= totalLosses
            ? "border-green-500/20 bg-green-500/5 text-green-400"
            : "border-ui-border bg-white/[0.02] text-ui-text-2",
        )}>
          {totalWins >= totalLosses
            ? `🏆 Selesai — ${totalWins}W ${totalLosses}L`
            : `Selesai — ${totalWins}W ${totalLosses}L`}
        </div>
      )}
    </div>
  );
};
export { TournamentJourney };
