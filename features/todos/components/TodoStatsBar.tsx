interface Props {
  overdueCount: number;
  todayCount: number;
  totalCount: number;
}

const TodoStatsBar = ({ overdueCount, todayCount, totalCount }: Props) => (
  <div className="flex items-center gap-5 text-sm">
    {overdueCount > 0 && (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="font-medium text-red-400">{overdueCount} terlambat</span>
      </span>
    )}
    {todayCount > 0 && (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-orange-400" />
        <span className="text-orange-400">{todayCount} hari ini</span>
      </span>
    )}
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-ui-text-muted" />
      <span className="text-ui-text-2">{totalCount} total</span>
    </span>
  </div>
);

export { TodoStatsBar };
