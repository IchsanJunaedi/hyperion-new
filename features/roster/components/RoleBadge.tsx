import { cn } from "@/lib/utils/cn";
import type { MemberRole } from "@/types/database";

const ROLE_CONFIG: Record<MemberRole, { label: string; className: string }> = {
  owner: {
    label: "owner",
    className: "text-yellow-400",
  },
  captain: {
    label: "captain",
    className: "text-green-400",
  },
  coach: {
    label: "coach",
    className: "text-purple-400",
  },
  manager: {
    label: "manager",
    className: "text-blue-400",
  },
  member: {
    label: "member",
    className: "text-ui-text-muted",
  },
};

const standardizeRole = (role: string): MemberRole => {
  const lower = role.toLowerCase().trim();
  if (lower === "pelatih") return "coach";
  if (lower === "manajer") return "manager";
  return lower as MemberRole;
};

const RoleBadge = ({ role }: { role: MemberRole | string }) => {
  const cleanRole = standardizeRole(role);
  const config = ROLE_CONFIG[cleanRole] || {
    label: cleanRole,
    className: "text-ui-text-muted",
  };

  return (
    <div className="inline-flex h-7 items-center px-2">
      <span className={cn("text-xs font-semibold", config.className)}>
        {config.label}
      </span>
    </div>
  );
};
export { standardizeRole, RoleBadge };
