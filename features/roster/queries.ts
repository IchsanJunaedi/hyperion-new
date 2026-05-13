import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Json, MemberAvailability, MemberRole } from "@/types/database";

export type RosterMember = {
  id: string;
  user_id: string;
  role: MemberRole;
  jersey_number: number | null;
  position: string | null;
  availability: MemberAvailability;
  joined_at: string;
  division_id: string | null;
  division_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone_wa: string | null;
  game_ids: Json;
};

export async function getRosterMembers(orgId: string): Promise<RosterMember[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("team_members")
    .select(
      "id, user_id, role, jersey_number, position, availability, joined_at, division_id",
    )
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("role")
    .order("joined_at");

  if (error || !members || members.length === 0) return [];

  const userIds = [...new Set(members.map((m) => m.user_id))];
  const divisionIds = [
    ...new Set(members.map((m) => m.division_id).filter(Boolean) as string[]),
  ];

  const [profilesRes, divisionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, phone_wa, game_ids")
      .in("id", userIds),
    divisionIds.length > 0
      ? supabase
          .from("divisions")
          .select("id, name")
          .in("id", divisionIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p]),
  );
  const divisionMap = new Map(
    (divisionsRes.data ?? []).map((d) => [d.id, d]),
  );

  return members.map((m) => {
    const profile = profileMap.get(m.user_id);
    const division = m.division_id ? divisionMap.get(m.division_id) : null;
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      jersey_number: m.jersey_number,
      position: m.position,
      availability: m.availability,
      joined_at: m.joined_at,
      division_id: m.division_id,
      division_name: division?.name ?? null,
      display_name: profile?.display_name ?? null,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
      phone_wa: profile?.phone_wa ?? null,
      game_ids: profile?.game_ids ?? {},
    };
  });
}

export async function getCurrentUserRole(
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
    .limit(1)
    .maybeSingle();

  return data?.role ?? null;
}
