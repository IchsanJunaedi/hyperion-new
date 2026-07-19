"use client";

import { cn } from "@/lib/utils/cn";
import type { TournamentStageWithMatches, TournamentMatch, TournamentGameResult } from "../queries";

interface PublicTournamentJourneyProps {
  stages: TournamentStageWithMatches[];
  tournamentName: string;
}

function getMatchScore(match: TournamentMatch): { teamScore: number; opponentScore: number; status: "win" | "loss" | "pending" } {
  const games = match.game_results ?? [];
  
  if (games.length === 0) {
    if (match.is_win === true) return { teamScore: 1, opponentScore: 0, status: "win" };
    if (match.is_win === false) return { teamScore: 0, opponentScore: 1, status: "loss" };
    return { teamScore: 0, opponentScore: 0, status: "pending" };
  }

  const teamScore = games.filter((g: TournamentGameResult) => g.is_win === true).length;
  const opponentScore = games.filter((g: TournamentGameResult) => g.is_win === false).length;

  let status: "win" | "loss" | "pending" = "pending";
  if (teamScore > opponentScore) status = "win";
  if (opponentScore > teamScore) status = "loss";

  return { teamScore, opponentScore, status };
}

export function PublicTournamentJourney({ stages, tournamentName }: PublicTournamentJourneyProps) {
  return (
    <div className="space-y-12">
      {stages.map((stage) => {
        if (stage.matches.length === 0) return null;

        return (
          <div key={stage.id} className="relative animate-fade-in-up">
            {/* Stage Title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-gradient-to-r from-[#F5C400]/50 to-transparent flex-1" />
              <h3 className="font-bebas text-3xl text-white tracking-widest drop-shadow-md">
                {stage.stage_name}
              </h3>
              <div className="h-px bg-gradient-to-l from-[#F5C400]/50 to-transparent flex-1" />
            </div>

            {/* Matches List */}
            <div className="grid grid-cols-1 gap-4">
              {stage.matches.map((match) => {
                const { teamScore, opponentScore, status } = getMatchScore(match);
                const isWin = status === "win";
                const isLoss = status === "loss";

                return (
                  <div
                    key={match.id}
                    className="group relative flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-md hover:border-[#F5C400]/40 hover:bg-slate-800/80 transition-all duration-300 shadow-xl overflow-hidden"
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#F5C400]/0 via-[#F5C400]/5 to-[#F5C400]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Hyperion Team */}
                    <div className="flex-1 flex w-full sm:w-auto justify-center sm:justify-end items-center gap-4 sm:pr-6 py-2 sm:py-0 z-10">
                      <span
                        className={cn(
                          "font-black text-2xl uppercase tracking-wider transition-colors duration-300",
                          isWin ? "text-white" : isLoss ? "text-white/50" : "text-white/80"
                        )}
                      >
                        HYPERION
                      </span>
                    </div>

                    {/* Score Area */}
                    <div className="flex flex-col items-center shrink-0 z-10 my-2 sm:my-0">
                      <div className="px-6 py-2 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center min-w-[120px] shadow-inner">
                        <span
                          className={cn(
                            "font-black text-3xl",
                            isWin ? "text-[#F5C400]" : isLoss ? "text-white/40" : "text-white/80"
                          )}
                        >
                          {teamScore}
                        </span>
                        <span className="mx-4 text-white/20 text-xl font-light">-</span>
                        <span
                          className={cn(
                            "font-black text-3xl",
                            isLoss ? "text-red-400" : isWin ? "text-white/40" : "text-white/80"
                          )}
                        >
                          {opponentScore}
                        </span>
                      </div>
                    </div>

                    {/* Opponent */}
                    <div className="flex-1 flex w-full sm:w-auto justify-center sm:justify-start items-center gap-4 sm:pl-6 py-2 sm:py-0 z-10">
                      <span
                        className={cn(
                          "font-black text-2xl uppercase tracking-wider transition-colors duration-300",
                          isLoss ? "text-white" : isWin ? "text-white/50" : "text-white/80"
                        )}
                      >
                        {match.opponent_name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
