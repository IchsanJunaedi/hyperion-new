import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { OverviewStats, FormatStat, RecentScrim } from "@/features/analytics/queries";

interface OverviewTabProps {
  stats: OverviewStats;
  formatBreakdown: FormatStat[];
  recentScrims: RecentScrim[];
  slug: string;
}

const FORMAT_LABELS: Record<string, string> = {
  bo1: "BO1",
  bo2: "BO2",
  bo3: "BO3",
  bo5: "BO5",
  bo7: "BO7",
  "4match": "4 Match",
};

const OverviewTab = ({ stats, formatBreakdown, recentScrims, slug }: OverviewTabProps) => {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Scrim" value={String(stats.total)} sub="completed" />
        <StatCard
          label="Menang"
          value={String(stats.wins)}
          sub="kemenangan"
          valueClass="text-emerald-400"
        />
        <StatCard
          label="Kalah"
          value={String(stats.losses)}
          sub="kekalahan"
          valueClass="text-rose-400"
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          sub="keseluruhan"
          valueClass={stats.winRate >= 50 ? "text-yellow-400" : "text-rose-400"}
        />
      </div>

      {/* Win Rate Bar + Format Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Win Rate Bar */}
        <div className="rounded-2xl border border-ui-border bg-ui-surface p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">
            Win Rate Keseluruhan
          </p>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span
                className={`text-3xl font-bold ${
                  stats.winRate >= 50 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {stats.winRate}%
              </span>
              <span className="text-xs text-ui-text-muted">
                {stats.wins}W · {stats.losses}L · {stats.draws}D
              </span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-ui-elevated">
              <div
                style={{ width: `${(stats.wins / (stats.total || 1)) * 100}%` }}
                className="h-full bg-emerald-500/70"
              />
              <div
                style={{ width: `${(stats.draws / (stats.total || 1)) * 100}%` }}
                className="h-full bg-zinc-500/40"
              />
              <div
                style={{ width: `${(stats.losses / (stats.total || 1)) * 100}%` }}
                className="h-full bg-rose-500/70"
              />
            </div>
            <div className="flex gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-ui-text-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Menang
              </span>
              <span className="flex items-center gap-1.5 text-ui-text-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                Seri
              </span>
              <span className="flex items-center gap-1.5 text-ui-text-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                Kalah
              </span>
            </div>
          </div>
        </div>

        {/* Format Breakdown */}
        <div className="rounded-2xl border border-ui-border bg-ui-surface p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">
            Per Format
          </p>
          {formatBreakdown.length === 0 ? (
            <p className="text-xs text-ui-text-muted">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {formatBreakdown.map((f) => (
                <div key={f.format} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ui-text">
                      {FORMAT_LABELS[f.format] ?? f.format.toUpperCase()}
                    </span>
                    <span className="text-ui-text-muted">
                      {f.wins}W / {f.losses}L · {f.winRate}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ui-elevated">
                    <div
                      style={{ width: `${f.winRate}%` }}
                      className={`h-full rounded-full ${
                        f.winRate >= 50 ? "bg-emerald-500/60" : "bg-rose-500/60"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Scrims */}
      <div className="rounded-2xl border border-ui-border bg-ui-surface overflow-hidden">
        <div className="border-b border-ui-border px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">
            10 Scrim Terakhir
          </p>
        </div>
        {recentScrims.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-ui-text-muted">
            Belum ada scrim selesai.
          </p>
        ) : (
          <div className="divide-y divide-ui-border">
            {recentScrims.map((s) => (
              <Link
                key={s.id}
                href={`/${slug}/scrim/${s.id}`}
                className="group grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 transition-colors hover:bg-ui-hover cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ui-text transition-colors group-hover:text-ui-text">
                    vs {s.opponent_name}
                  </p>
                  <p className="text-xs text-ui-text-muted">
                    {format(new Date(s.scheduled_at), "d MMM yyyy", { locale: id })}
                    {s.division_name ? ` · ${s.division_name}` : ""}
                  </p>
                </div>
                <span className="font-mono text-xs text-ui-text-2">
                  {FORMAT_LABELS[s.format.toLowerCase()] ?? s.format.toUpperCase()}
                </span>
                {s.our_score !== null && s.opponent_score !== null ? (
                  <span className="text-xs font-medium text-ui-text-2">
                    {s.our_score}–{s.opponent_score}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-bold ${
                    s.is_win === true
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : s.is_win === false
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        : "border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
                  }`}
                >
                  {s.is_win === true ? "W" : s.is_win === false ? "L" : "D"}
                </span>
                <ChevronRight className="h-4 w-4 text-ui-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export { OverviewTab };

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
