import { cn } from "@/lib/utils/cn";
import type { MemberRole } from "@/types/database";

const ROLE_CONFIG: Record<MemberRole, { label: string; className: string }> = {
  owner: {
    label: "Owner",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  },
  captain: {
    label: "Captain",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  coach: {
    label: "Pelatih",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  },
  manager: {
    label: "Manajer",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  },
  member: {
    label: "Member",
    className: "bg-white/5 text-white/55 border-white/10",
  },
};

export function RoleBadge({ role }: { role: MemberRole }) {
  const { label, className } = ROLE_CONFIG[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
