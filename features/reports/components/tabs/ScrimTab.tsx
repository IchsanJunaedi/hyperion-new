import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { MonthlyReport } from "@/features/reports/queries";

const FORMAT_LABELS: Record<string, string> = {
  bo1: "BO1", bo2: "BO2", bo3: "BO3", bo5: "BO5", bo7: "BO7", "4match": "4 Match",
};

const ScrimTab = ({ report }: { report: MonthlyReport }) => {
  const { scrims } = report;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { label: "Total",  value: scrims.total,  sub: "scrim selesai", cls: "text-[#E5E2E1]" },
          { label: "Menang", value: scrims.wins,   sub: "kemenangan",    cls: "text-emerald-400" },
          { label: "Kalah",  value: scrims.losses, sub: "kekalahan",     cls: "text-rose-400" },
          { label: "Seri",   value: scrims.draws,  sub: "draw",          cls: "text-[#9B9A97]" },
        ] as const).map((c) => (
          <div key={c.label} className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">{c.label}</p>
            <p className={`text-2xl font-bold ${c.cls}`}>{c.value}</p>
            <p className="text-xs text-[#9B9A97]">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Win rate bar */}
      {scrims.total > 0 && (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9B9A97]">Win Rate</span>
            <span className={`font-bold ${scrims.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
              {scrims.winRate}%
            </span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-[#252525]">
            <div className="h-full bg-emerald-500/60" style={{ width: `${(scrims.wins / scrims.total) * 100}%` }} />
            <div className="h-full bg-zinc-500/40" style={{ width: `${(scrims.draws / scrims.total) * 100}%` }} />
            <div className="h-full bg-rose-500/60" style={{ width: `${(scrims.losses / scrims.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Per-division breakdown — only if >1 entry */}
      {scrims.byDivision.length > 1 && (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2D2D2D]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">Per Divisi</p>
          </div>
          <div className="divide-y divide-[#2D2D2D]">
            {scrims.byDivision.map((div) => (
              <div
                key={div.divisionId ?? "__none__"}
                className="px-5 py-3 grid grid-cols-[1fr_auto_auto_auto_120px] items-center gap-4"
              >
                <span className="text-sm text-[#E5E2E1] truncate">{div.divisionName}</span>
                <span className="text-xs text-[#9B9A97] w-8 text-center">{div.total}</span>
                <span className="text-xs text-emerald-400 w-10 text-center">{div.wins}W</span>
                <span className="text-xs text-rose-400 w-8 text-center">{div.losses}L</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[#252525] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${div.winRate >= 50 ? "bg-emerald-500/60" : "bg-rose-500/60"}`}
                      style={{ width: `${div.winRate}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold w-9 text-right ${div.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                    {div.winRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scrim list */}
      {scrims.list.length > 0 && (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2D2D2D]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">
              Daftar Scrim Bulan Ini
            </p>
          </div>
          <div className="divide-y divide-[#2D2D2D]">
            {scrims.list.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-2.5">
                {s.isWin === true
                  ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  : s.isWin === false
                  ? <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  : <MinusCircle className="h-4 w-4 shrink-0 text-[#6B6A68]" />}
                <span className="text-sm text-[#E5E2E1] truncate flex-1">vs {s.opponentName}</span>
                <span className="text-[11px] text-[#6B6A68] shrink-0">
                  {FORMAT_LABELS[s.format] ?? s.format.toUpperCase()}
                </span>
                {s.divisionName && (
                  <span className="hidden sm:inline text-[10px] bg-[#252525] text-[#9B9A97] px-2 py-0.5 rounded-full shrink-0">
                    {s.divisionName}
                  </span>
                )}
                <span className="text-[11px] text-[#6B6A68] shrink-0">
                  {format(new Date(s.scheduledAt), "d MMM", { locale: idLocale })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {scrims.total === 0 && (
        <p className="text-sm text-[#6B6A68] text-center py-8">Tidak ada scrim di bulan ini.</p>
      )}
    </div>
  );
};
export { ScrimTab };
