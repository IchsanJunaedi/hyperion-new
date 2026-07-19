"use client";

import { Trophy } from "lucide-react";
import type { TournamentAnalyticsData } from "@/features/analytics/queries";

interface TournamentOverviewTabProps {
  data: TournamentAnalyticsData;
}

const TournamentOverviewTab = ({ data }: TournamentOverviewTabProps) => {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Match" value={String(data.total)} sub="dimainkan" />
        <StatCard
          label="Menang"
          value={String(data.wins)}
          sub="kemenangan"
          valueClass="text-emerald-400"
        />
        <StatCard
          label="Kalah"
          value={String(data.losses)}
          sub="kekalahan"
          valueClass="text-rose-400"
        />
        <StatCard
          label="Win Rate"
          value={`${data.winRate}%`}
          sub="keseluruhan"
          valueClass={data.winRate >= 50 ? "text-yellow-400" : "text-rose-400"}
        />
      </div>

      {/* Win rate bar */}
      {data.total > 0 && (
        <div className="rounded-2xl border border-ui-border bg-ui-surface p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">
            Win Rate Tournament
          </p>
          <div className="flex items-baseline justify-between">
            <span
              className={`text-3xl font-bold ${
                data.winRate >= 50 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {data.winRate}%
            </span>
            <span className="text-xs text-ui-text-muted">
              {data.wins}W · {data.losses}L
            </span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-ui-elevated">
            <div
              style={{ width: `${(data.wins / (data.total || 1)) * 100}%` }}
              className="h-full bg-emerald-500/70"
            />
            <div
              style={{ width: `${(data.losses / (data.total || 1)) * 100}%` }}
              className="h-full bg-rose-500/70"
            />
          </div>
        </div>
      )}

      {/* Recent tournament matches */}
      <div className="rounded-2xl border border-ui-border bg-ui-surface overflow-hidden">
        <div className="border-b border-ui-border px-5 py-4 flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-yellow-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">
            Match Tournament Terakhir
          </p>
        </div>
        {data.recentMatches.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-ui-text-muted">
            Belum ada result match tournament.
          </p>
        ) : (
          <div className="divide-y divide-ui-border">
            {data.recentMatches.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ui-text">
                    {m.round_label}
                    {m.opponent_name && (
                      <span className="text-ui-text-muted"> vs {m.opponent_name}</span>
                    )}
                  </p>
                  <p className="text-xs text-ui-text-muted">
                    {m.tournament_name}
                    {m.match_format && ` · ${m.match_format}`}
                  </p>
                </div>
                {m.our_score != null && m.opponent_score != null ? (
                  <span className="text-xs font-medium text-ui-text-2">
                    {m.our_score}–{m.opponent_score}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-bold ${
                    m.is_win === true
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : m.is_win === false
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        : "border-zinc-500/20 bg-zinc-500/10 text-ui-text-2"
                  }`}
                >
                  {m.is_win === true ? "W" : m.is_win === false ? "L" : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export { TournamentOverviewTab };

function StatCard({
  label,
  value,
  sub,
  valueClass = "text-ui-text",
}: {
  label: string;
  value: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="space-y-1 rounded-2xl border border-ui-border bg-ui-surface p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ui-text-2">
        {label}
      </p>
      <p className={`text-3xl font-bold tracking-tight ${valueClass}`}>{value}</p>
      <p className="text-[11px] text-ui-text-muted">{sub}</p>
    </div>
  );
}
