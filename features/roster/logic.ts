import type { RosterMember } from "./queries";
import type { MemberRole } from "@/types/database";

const ROLE_PRIORITY: Record<MemberRole, number> = {
  owner: 5,
  manager: 4,
  coach: 3,
  captain: 2,
  member: 1,
};

/**
 * Sorts roster members based on role hierarchy (owner > manager > coach > captain > member).
 * Ties are broken by joined_at date (earliest first).
 */
export function sortMembersByRole(members: RosterMember[]): RosterMember[] {
  return [...members].sort((a, b) => {
    const priorityA = ROLE_PRIORITY[a.role] ?? 0;
    const priorityB = ROLE_PRIORITY[b.role] ?? 0;
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Descending priority
    }
    // Break ties with joined_at date (ascending)
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });
}

/**
 * Filters roster members by division_id.
 */
export function filterMembersByDivision(
  members: RosterMember[],
  divisionId: string | null,
): RosterMember[] {
  return members.filter((m) => m.division_id === divisionId);
}

/**
 * Formats a member's display name, appending jersey number if present.
 */
export function getMemberDisplayName(
  member: Partial<Pick<RosterMember, "display_name" | "username" | "jersey_number">>,
): string {
  const baseName = member.display_name?.trim() || member.username?.trim() || "Anonymous Player";
  if (member.jersey_number !== undefined && member.jersey_number !== null) {
    return `#${member.jersey_number} ${baseName}`;
  }
  return baseName;
}

/**
 * Validates if a current user role is authorized to assign a target role to another member.
 * Rules:
 * - Owner: can assign manager, coach, captain, member
 * - Manager: can assign captain, member
 * - Coach, Captain, Member: cannot assign roles
 */
export function canAssignRole(
  currentUserRole: MemberRole,
  targetRole: MemberRole,
): boolean {
  if (currentUserRole === "owner") {
    // Owner can assign any role except owner (owner is globally unique and email-env driven)
    return targetRole !== "owner";
  }
  if (currentUserRole === "manager") {
    return targetRole === "captain" || targetRole === "member";
  }
  return false;
}
