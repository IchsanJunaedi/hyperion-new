interface ChartCardProps {
  title: string;
  subtitle?: string;
  isEmpty?: boolean;
  children: React.ReactNode;
}

const ChartCard = ({ title, subtitle, isEmpty, children }: ChartCardProps) => {
  return (
    <div className="rounded-xl border border-ui-border bg-ui-surface p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-ui-text">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ui-text-muted">{subtitle}</p>}
      </div>
      <div className="relative">
        {children}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-ui-text-muted">Belum ada data</span>
          </div>
        )}
      </div>
    </div>
  );
};
export { ChartCard };
