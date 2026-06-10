import { Sparkles } from "lucide-react";

const AIInsightsTab = () => {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-ui-border bg-ui-surface p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ui-elevated">
        <Sparkles className="h-6 w-6 text-ui-text-muted" />
      </div>
      <div>
        <p className="text-sm font-semibold text-ui-text">AI Insights</p>
        <p className="mt-1 text-xs text-ui-text-muted">
          Analisis AI sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
};
export { AIInsightsTab };
