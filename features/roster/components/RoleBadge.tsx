import { cn } from "@/lib/utils/cn";
import type { MemberRole } from "@/types/database";

const ROLE_CONFIG: Record<MemberRole, { label: string; className: string }> = {
  owner: {
    label: "Owner",
    className: "bg-yellow-500/10 text-yellow-400",
  },
  captain: {
    label: "Captain",
    className: "bg-purple-500/10 text-purple-400",
  },
  coach: {
    label: "Pelatih",
    className: "bg-pink-500/10 text-pink-400",
  },
  manager: {
    label: "Manajer",
    className: "bg-blue-500/10 text-blue-400",
  },
  member: {
    label: "Member",
    className: "bg-white/5 text-white/55",
  },
};

export function RoleBadge({ role }: { role: MemberRole }) {
  const { label, className } = ROLE_CONFIG[role];
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
