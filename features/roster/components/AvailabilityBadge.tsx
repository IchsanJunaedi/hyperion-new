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
    className: "text-green-500",
  },
  hiatus: {
    label: "Hiatus",
    className: "text-amber-500",
  },
  unavailable: {
    label: "Tidak Tersedia",
    className: "text-red-500",
  },
};

const AvailabilityBadge = ({ availability }: AvailabilityBadgeProps) => {
  const { label, className } = config[availability];

  return (
    <div className="inline-flex h-8 w-36 items-center px-3">
      <span className={cn("text-xs font-semibold", className)}>
        {label}
      </span>
    </div>
  );
};
export { AvailabilityBadge };
