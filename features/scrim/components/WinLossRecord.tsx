import type { WinLossRecord } from "@/features/scrim/queries";

interface WinLossRecordProps {
  record: WinLossRecord;
}

export function WinLossRecordBadge({ record }: WinLossRecordProps) {
  if (record.total === 0) return null;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-emerald-400 font-medium">{record.wins}W</span>
      </span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        <span className="text-rose-400 font-medium">{record.losses}L</span>
      </span>
      {record.draws > 0 && (
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <span className="text-white/50 font-medium">{record.draws}D</span>
        </span>
      )}
    </div>
  );
}
