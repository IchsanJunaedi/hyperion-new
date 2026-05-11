import { Crown, Shield, User, BookOpen, Wrench } from "lucide-react";

import type { MemberRole } from "@/types/database";

const STYLE: Record<MemberRole, string> = {
  owner: "bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/30",
  captain: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  coach: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30",
  manager: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  member: "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-500/30",
};

const LABEL: Record<MemberRole, string> = {
  owner: "Owner",
  captain: "Captain",
  coach: "Coach",
  manager: "Manager",
  member: "Member",
};

const ICONS: Record<MemberRole, typeof Crown> = {
  owner: Crown,
  captain: Shield,
  coach: BookOpen,
  manager: Wrench,
  member: User,
};

export function MemberRoleBadge({
  role,
  size = "sm",
}: {
  role: MemberRole;
  size?: "sm" | "md";
}) {
  const Icon = ICONS[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} font-medium uppercase tracking-wide ${STYLE[role]}`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {LABEL[role]}
    </span>
  );
}
