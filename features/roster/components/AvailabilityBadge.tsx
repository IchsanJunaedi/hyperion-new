import { cn } from "@/lib/utils/cn";
import type { MemberAvailability } from "@/types/database";

interface AvailabilityBadgeProps {
  availability: MemberAvailability;
}

const config: Record<
  MemberAvailability,
  { label: string; className: string }
> = {
  active: {
    label: "Aktif",
    className: "bg-green-500/10 text-green-400",
  },
  hiatus: {
    label: "Hiatus",
    className: "bg-amber-500/10 text-amber-400",
  },
  unavailable: {
    label: "Tidak Tersedia",
    className: "bg-red-500/10 text-red-400",
  },
};

export function AvailabilityBadge({ availability }: AvailabilityBadgeProps) {
  const { label, className } = config[availability];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full",
        className,
      )}
    >
      {label}
    </span>
  );
}
