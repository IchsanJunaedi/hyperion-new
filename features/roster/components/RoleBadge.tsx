import { cn } from "@/lib/utils/cn";
import type { MemberRole } from "@/types/database";

const ROLE_CONFIG: Record<MemberRole, { label: string; className: string }> = {
  owner: {
    label: "Owner",
    className: "text-yellow-400",
  },
  captain: {
    label: "Captain",
    className: "text-purple-400",
  },
  coach: {
    label: "Pelatih",
    className: "text-pink-400",
  },
  manager: {
    label: "Manajer",
    className: "text-blue-400",
  },
  member: {
    label: "Member",
    className: "text-[#9B9A97]",
  },
};

export function RoleBadge({ role }: { role: MemberRole }) {
  const { label, className } = ROLE_CONFIG[role];
  return (
    <div className="inline-flex h-7 items-center px-2">
      <span className={cn("text-xs font-semibold", className)}>
        {label}
      </span>
    </div>
  );
}
