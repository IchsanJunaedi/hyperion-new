import { cn } from "@/lib/utils/cn";
import type { SponsorStatus } from "../queries";

const STATUS_STYLES: Record<SponsorStatus, string> = {
  prospect: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active:   "bg-green-500/10 text-green-400 border-green-500/20",
  inactive: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ended:    "bg-white/5 text-white/40 border-white/10",
};

const STATUS_LABELS: Record<SponsorStatus, string> = {
  prospect: "Prospek",
  active:   "Aktif",
  inactive: "Tidak Aktif",
  ended:    "Selesai",
};

export function SponsorStatusBadge({ status }: { status: SponsorStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export { STATUS_LABELS, STATUS_STYLES };
