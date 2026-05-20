import { Sparkles } from "lucide-react";

export function AIInsightsTab() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C] p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252525]">
        <Sparkles className="h-6 w-6 text-[#6B6A68]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#E5E2E1]">AI Insights</p>
        <p className="mt-1 text-xs text-[#6B6A68]">
          Analisis AI sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
}
