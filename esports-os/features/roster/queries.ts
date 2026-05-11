import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database, MemberRole } from "@/types/database";

type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DivisionRow = Database["public"]["Tables"]["divisions"]["Row"];
type InviteRow = Database["public"]["Tables"]["organization_invites"]["Row"];

export interface RosterMember extends TeamMemberRow {
  profile: Pick<
    ProfileRow,
    "id" | "display_name" | "username" | "avatar_url" | "phone_wa"
  > | null;
  division: Pick<DivisionRow, "id" | "name" | "slug" | "game"> | null;
}

export interface PendingInvite extends InviteRow {
  division: Pick<DivisionRow, "id" | "name" | "slug"> | null;
  inviter: Pick<ProfileRow, "id" | "display_name" | "username"> | null;
}

export interface RosterSummary {
  total: number;
  byRole: Record<MemberRole, number>;
  byDivision: Array<{
    division_id: string | null;
    division_name: string | null;
    count: number;
  }>;
}

/**
 * Caller's role within the given org. Returns null if not a member.
 * Used to gate UI affordances client-side (edit/remove buttons). The
 * authoritative gate is RLS — UI absence is just for UX.
 */
export async function getCurrentMemberRole(
  orgId: string,
): Promise<MemberRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("team_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("role", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.role ?? null;
}

/**
 * List all members of an org. Optional division filter. Joins profile +
 * division via separate queries (the hand-typed Database shape doesn't
 * expose nested rels). Fails soft.
 */
export async function listRosterMembers(
  orgId: string,
  options: { divisionId?: string | null; includeInactive?: boolean } = {},
): Promise<RosterMember[]> {
  const supabase = await createClient();
  let q = supabase
    .from("team_members")
    .select("*")
    .eq("organization_id", orgId);

  if (options.divisionId !== undefined) {
    q =
      options.divisionId === null
        ? q.is("division_id", null)
        : q.eq("division_id", options.divisionId);
  }
  if (!options.includeInactive) {
    q = q.eq("is_active", true);
  }
  q = q.order("joined_at", { ascending: true });

  const { data: members, error } = await q;
  if (error || !members) return [];
  if (members.length === 0) return [];

  const userIds = Array.from(new Set(members.map((m) => m.user_id)));
  const divisionIds = Array.from(
    new Set(
      members
        .map((m) => m.division_id)
        .filter((v): v is string => v !== null),
    ),
  );

  const [profilesRes, divisionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, phone_wa")
      .in("id", userIds),
    divisionIds.length > 0
      ? supabase
          .from("divisions")
          .select("id, name, slug, game")
          .in("id", divisionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p] as const),
  );
  const divisionMap = new Map(
    (divisionsRes.data ?? []).map((d) => [d.id, d] as const),
  );

  return members.map((m) => ({
    ...m,
    profile: profileMap.get(m.user_id) ?? null,
    division: m.division_id ? (divisionMap.get(m.division_id) ?? null) : null,
  }));
}

export async function getRosterMember(
  memberId: string,
): Promise<RosterMember | null> {
  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle();
  if (error || !member) return null;

  const [profileRes, divisionRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, phone_wa")
      .eq("id", member.user_id)
      .maybeSingle(),
    member.division_id
      ? supabase
          .from("divisions")
          .select("id, name, slug, game")
          .eq("id", member.division_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return {
    ...member,
    profile: profileRes.data ?? null,
    division: divisionRes.data ?? null,
  };
}

/**
 * Pending invites for an org. RLS limits this to captain+ for the org
 * (or the inviter themselves), so unauthorized callers will get an
 * empty list rather than a 403.
 */
export async function listPendingInvites(
  orgId: string,
): Promise<PendingInvite[]> {
  const supabase = await createClient();
  const { data: invites, error } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error || !invites || invites.length === 0) return [];

  const inviterIds = Array.from(new Set(invites.map((i) => i.invited_by)));
  const divisionIds = Array.from(
    new Set(
      invites
        .map((i) => i.division_id)
        .filter((v): v is string => v !== null),
    ),
  );

  const [profilesRes, divisionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username")
      .in("id", inviterIds),
    divisionIds.length > 0
      ? supabase
          .from("divisions")
          .select("id, name, slug")
          .in("id", divisionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p] as const),
  );
  const divisionMap = new Map(
    (divisionsRes.data ?? []).map((d) => [d.id, d] as const),
  );

  return invites.map((i) => ({
    ...i,
    inviter: profileMap.get(i.invited_by) ?? null,
    division: i.division_id ? (divisionMap.get(i.division_id) ?? null) : null,
  }));
}

const ROLE_ORDER: MemberRole[] = [
  "owner",
  "captain",
  "coach",
  "manager",
  "member",
];

export function summarizeRoster(members: RosterMember[]): RosterSummary {
  const byRole: Record<MemberRole, number> = {
    owner: 0,
    captain: 0,
    member: 0,
    coach: 0,
    manager: 0,
  };
  const divisionAgg = new Map<
    string | "__none__",
    { division_id: string | null; division_name: string | null; count: number }
  >();

  for (const m of members) {
    byRole[m.role] = (byRole[m.role] ?? 0) + 1;
    const key = m.division_id ?? "__none__";
    const current = divisionAgg.get(key);
    if (current) {
      current.count += 1;
    } else {
      divisionAgg.set(key, {
        division_id: m.division_id,
        division_name: m.division?.name ?? null,
        count: 1,
      });
    }
  }

  return {
    total: members.length,
    byRole,
    byDivision: Array.from(divisionAgg.values()).sort(
      (a, b) => b.count - a.count,
    ),
  };
}

export function sortRosterByRoleThenName(
  members: RosterMember[],
): RosterMember[] {
  return [...members].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a.role);
    const bi = ROLE_ORDER.indexOf(b.role);
    if (ai !== bi) return ai - bi;
    const an = a.profile?.display_name ?? a.profile?.username ?? "";
    const bn = b.profile?.display_name ?? b.profile?.username ?? "";
    return an.localeCompare(bn, "id");
  });
}
