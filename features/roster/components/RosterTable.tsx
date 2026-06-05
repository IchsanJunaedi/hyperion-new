"use client";

import { ExternalLink, UserPlus } from "lucide-react";
import { useState } from "react";

import { AvailabilityBadge } from "@/features/roster/components/AvailabilityBadge";
import { AvailabilitySelector } from "@/features/roster/components/AvailabilitySelector";
import { MainRoleBadge, MainRoleSelector } from "@/features/roster/components/MainRoleSelector";
import { cn } from "@/lib/utils/cn";
import type { MemberRole } from "@/types/database";

import type { RosterMember } from "../queries";
import { attendanceBucket } from "../logic";
import { InviteForm } from "./InviteForm";
import { KickMemberButton } from "./KickMemberButton";
import { RoleBadge } from "./RoleBadge";
import { RoleSelector } from "./RoleSelector";
import type { MainRole } from "../actions/updateMainRole";

const ATTENDANCE_COLORS: Record<string, string> = {
  high: "text-emerald-400",
  mid: "text-yellow-400",
  low: "text-rose-400",
  none: "text-white/30",
};

interface RosterTableProps {
  members: RosterMember[];
  currentUserId: string;
  currentUserRole: MemberRole;
  orgSlug: string;
  orgId: string;
  divisions: Array<{ id: string; name: string }>;
}

const RosterTable = ({
  members,
  currentUserId,
  currentUserRole,
  orgSlug,
  orgId,
  divisions,
}: RosterTableProps) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const isCaptainOrAbove =
    currentUserRole === "owner" || currentUserRole === "captain";
  const isManagerOrAbove =
    currentUserRole === "owner" || currentUserRole === "manager";
  const canAssignMainRole =
    currentUserRole === "owner" ||
    currentUserRole === "manager" ||
    currentUserRole === "coach";

  const ROLE_ORDER: Record<string, number> = { owner: 0, manager: 1, coach: 2, captain: 3, member: 4 };

  const sortedMembers = [...members].sort((a, b) => {
    const roleA = ROLE_ORDER[a.role] ?? 99;
    const roleB = ROLE_ORDER[b.role] ?? 99;
    if (roleA !== roleB) return roleA - roleB;

    const nameA = (a.display_name ?? a.username ?? "").toLowerCase();
    const nameB = (b.display_name ?? b.username ?? "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-4">
      {/* Invite panel */}
      {isManagerOrAbove && (
        <div>
          {showInviteForm ? (
            <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-5">
              <InviteForm
                orgSlug={orgSlug}
                orgId={orgId}
                divisions={divisions}
                members={members}
                onClose={() => setShowInviteForm(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <UserPlus className="h-4 w-4" />
              Undang Member
            </button>
          )}
        </div>
      )}

      {/* Member list */}
      <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/40">
        {members.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-white/50">
            Belum ada member aktif.
          </p>
        )}

        {sortedMembers.map((m, idx) => {
          const isSelf = m.user_id === currentUserId;
          // RLS: captain+ can update any non-owner member; cannot reassign owner role
          const canEditRole =
            isCaptainOrAbove && m.role !== "owner" && !isSelf;
          // Self can change availability; Owner can change anyone; Manager can change anyone except Owner; Captain can change anyone except Owner/Manager
          const canChangeAvailability =
            isSelf ||
            currentUserRole === "owner" ||
            (currentUserRole === "manager" && m.role !== "owner") ||
            (currentUserRole === "captain" && m.role !== "owner" && m.role !== "manager");
          // Owner can kick others; Manager can kick Captain & Member; anyone (except owner) can self-leave
          const canKick =
            (currentUserRole === "owner" && !isSelf) ||
            (currentUserRole === "manager" && !isSelf && m.role !== "owner" && m.role !== "manager") ||
            (isSelf && currentUserRole !== "owner");

          const initials = (m.display_name ?? m.username ?? "?")
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0] ?? "")
            .join("")
            .toUpperCase();

          return (
            <div
              key={m.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Avatar + name + division */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {m.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.avatar_url}
                    alt={m.display_name ?? ""}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-white">
                    <span className="truncate">
                      {m.display_name ?? m.username ?? "Unnamed"}
                    </span>
                    {isSelf && (
                      <span className="text-xs font-normal text-white/40">
                        (Saya)
                      </span>
                    )}
                    {m.username && (
                      <a
                        href={`/players/${m.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Buka profil publik"
                        className="shrink-0 text-white/30 transition hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-white/50">
                    {m.division_name && <span>{m.division_name}</span>}
                    {m.position && (
                      <>
                        {m.division_name && <span className="text-white/20">·</span>}
                        <span>{m.position}</span>
                      </>
                    )}
                    {m.jersey_number != null && (
                      <>
                        {(m.division_name || m.position) && <span className="text-white/20">·</span>}
                        <span className="font-mono">#{m.jersey_number}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Grid-aligned Actions Segment */}
              <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
                {/* Attendance rate */}
                <div className="flex shrink-0 flex-col items-start justify-center sm:w-16">
                  <span className="text-[10px] uppercase tracking-wide text-white/30">Hadir</span>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      ATTENDANCE_COLORS[attendanceBucket(m.attendance_rate)],
                    )}
                  >
                    {m.attendance_rate === null ? "—" : `${m.attendance_rate}%`}
                  </span>
                </div>

                {/* Role */}
                <div className="flex shrink-0 items-center justify-start sm:w-24">
                  {canEditRole ? (
                    <RoleSelector
                      orgSlug={orgSlug}
                      memberId={m.id}
                      currentRole={m.role}
                    />
                  ) : (
                    <RoleBadge role={m.role} />
                  )}
                </div>

                {/* In-game role (only for captain/member) */}
                {(m.role === "captain" || m.role === "member") && (
                  <div className="flex shrink-0 items-center justify-start sm:w-28">
                    {canAssignMainRole ? (
                      <MainRoleSelector
                        orgSlug={orgSlug}
                        memberId={m.id}
                        currentMainRole={m.main_role as MainRole}
                        direction={idx >= sortedMembers.length - 2 && idx > 0 ? "up" : "down"}
                      />
                    ) : (
                      <MainRoleBadge mainRole={m.main_role as MainRole} />
                    )}
                  </div>
                )}
                {m.role !== "captain" && m.role !== "member" && (
                  <div className="shrink-0 sm:w-28" />
                )}

                {/* Availability */}
                <div className="flex shrink-0 justify-start sm:w-36">
                  {canChangeAvailability ? (
                    <AvailabilitySelector
                      orgSlug={orgSlug}
                      memberId={m.id}
                      currentAvailability={m.availability}
                      direction={idx >= sortedMembers.length - 2 && idx > 0 ? "up" : "down"}
                    />
                  ) : (
                    <AvailabilityBadge availability={m.availability} />
                  )}
                </div>

                {/* Kick / Leave */}
                <div className="flex shrink-0 justify-end sm:w-28">
                  {canKick ? (
                    <KickMemberButton
                      orgSlug={orgSlug}
                      memberId={m.id}
                      memberName={m.display_name ?? m.username ?? "member ini"}
                      isSelf={isSelf}
                    />
                  ) : (
                    // Elegant layout spacer to align grid perfectly
                    <div className="h-7 w-20" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export { RosterTable };
