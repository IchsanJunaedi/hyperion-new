import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { MonthlyReport } from "@/features/reports/queries";

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Akan Datang", ongoing: "Berjalan", completed: "Selesai", cancelled: "Dibatalkan",
};

const STATUS_CLASS: Record<string, string> = {
  upcoming:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ongoing:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const TournamentTab = ({ report }: { report: MonthlyReport }) => {
  const { tournaments } = report;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Total",    value: tournaments.total,     cls: "text-ui-text" },
          { label: "Berjalan", value: tournaments.ongoing,   cls: "text-yellow-400" },
          { label: "Selesai",  value: tournaments.completed, cls: "text-emerald-400" },
        ] as const).map((c) => (
          <div key={c.label} className="rounded-xl border border-ui-border bg-ui-surface p-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted">{c.label}</p>
            <p className={`text-2xl font-bold ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tournament cards */}
      {tournaments.list.length > 0 ? (
        <div className="space-y-3">
          {tournaments.list.map((t) => (
            <div key={t.id} className="rounded-xl border border-ui-border bg-ui-surface overflow-hidden">
              <div className="flex items-start justify-between px-5 py-4 border-b border-ui-border">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-ui-text">{t.name}</h3>
                  <p className="text-xs text-ui-text-muted">
                    {new Date(t.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                    {t.divisionName ? ` · ${t.divisionName}` : ""}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_CLASS[t.status] ?? STATUS_CLASS.upcoming}`}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>

              {t.stages.length > 0 && (
                <div className="px-5 py-3 space-y-2">
                  {t.stages.map((stage) => {
                    const total = stage.wins + stage.losses;
                    return (
                      <div key={stage.stageId} className="flex items-center gap-3">
                        <span className="text-xs text-ui-text-2 w-28 truncate shrink-0">{stage.stageName}</span>
                        {total > 0 ? (
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex gap-1">
                              {Array.from({ length: stage.wins }).map((_, i) => (
                                <CheckCircle key={i} className="h-3.5 w-3.5 text-emerald-400" />
                              ))}
                              {Array.from({ length: stage.losses }).map((_, i) => (
                                <XCircle key={i} className="h-3.5 w-3.5 text-rose-400" />
                              ))}
                            </div>
                            <span className="text-xs text-ui-text-muted">
                              {stage.wins}W · {stage.losses}L
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-ui-text-muted">
                            <Clock className="h-3.5 w-3.5" />
                            Belum dimainkan
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ui-text-muted text-center py-8">
          Tidak ada turnamen yang dimulai di bulan ini.
        </p>
      )}
    </div>
  );
};
export { TournamentTab };
