import type { MonthlyReport } from "@/features/reports/queries";

function rp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:   { label: "Aktif",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  prospect: { label: "Prospek",  cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  inactive: { label: "Inaktif",  cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  ended:    { label: "Selesai",  cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

const SponsorTab = ({ sponsors }: { sponsors: NonNullable<MonthlyReport["sponsors"]> }) => {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Total",   value: sponsors.total,   cls: "text-ui-text" },
          { label: "Aktif",   value: sponsors.active,  cls: "text-emerald-400" },
          { label: "Prospek", value: sponsors.prospect, cls: "text-blue-400" },
        ] as const).map((c) => (
          <div key={c.label} className="rounded-xl border border-ui-border bg-ui-surface p-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted">{c.label}</p>
            <p className={`text-2xl font-bold ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Total active value */}
      {sponsors.totalActiveValue > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted">Total Nilai Sponsor Aktif</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{rp(sponsors.totalActiveValue)}</p>
          </div>
          <span className="text-xs text-emerald-400/60 font-medium">kumulatif</span>
        </div>
      )}

      {/* Sponsor list */}
      {sponsors.list.length > 0 ? (
        <div className="rounded-xl border border-ui-border bg-ui-surface overflow-hidden">
          <div className="px-5 py-3 border-b border-ui-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-2">Daftar Sponsor</p>
          </div>
          <div className="divide-y divide-ui-border">
            {sponsors.list.map((s) => {
              const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG["inactive"]!;
              return (
                <div key={s.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-ui-text truncate">{s.name}</p>
                    {s.notes && (
                      <p className="text-xs text-ui-text-muted truncate">{s.notes}</p>
                    )}
                    {s.startDate && (
                      <p className="text-[10px] text-ui-text-muted">
                        Mulai {new Date(s.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                    {s.dealValue !== null && (
                      <span className="text-xs font-medium text-ui-text-2">{rp(s.dealValue)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-ui-text-muted text-center py-8">Belum ada sponsor yang tercatat.</p>
      )}
    </div>
  );
};
export { SponsorTab };
