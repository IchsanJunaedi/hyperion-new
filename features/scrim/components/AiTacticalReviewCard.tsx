import { Sparkles } from "lucide-react";

interface AiTacticalReviewCardProps {
  narrative: string;
}

const AiTacticalReviewCard = ({ narrative }: AiTacticalReviewCardProps) => {
  return (
    <div className="mt-3 rounded-xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/[0.06] to-transparent p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-yellow-300">
          Tinjauan Taktis AI — Draft vs Eksekusi
        </p>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ui-text-2">{narrative}</p>
    </div>
  );
};

export { AiTacticalReviewCard };
