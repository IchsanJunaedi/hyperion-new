import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus, Database } from "@/types/database";

export type Scrim = Database["public"]["Tables"]["scrims"]["Row"];
export type ScrimAttendance =
  Database["public"]["Tables"]["scrim_attendances"]["Row"];
export type ScrimResult =
  Database["public"]["Tables"]["scrim_results"]["Row"];

export type ScrimListFilter = "upcoming" | "ongoing" | "completed" | "all";

export interface ScrimWithCounts extends Scrim {
  /** Convenience aggregates merged client-side for the list cards. */
  attendance_counts: Record<AttendanceStatus, number>;
}

export interface ScrimDetail {
  scrim: Scrim;
  attendances: Array<{
    attendance: ScrimAttendance;
    member: {
      user_id: string;
      display_name: string | null;
      avatar_url: string | null;
      jersey_number: number | null;
      position: string | null;
    };
  }>;
  result: ScrimResult | null;
  divisionName: string | null;
  myAttendance: ScrimAttendance | null;
}

/**
 * List scrims for an org with a status-bucket filter. Sorted with the
 * most relevant entry first (next upcoming → top; most recent
 * completed → top).
 */
export async function listScrims(
  orgId: string,
  filter: ScrimListFilter,
): Promise<Scrim[]> {
  const supabase = await createClient();
  let q = supabase.from("scrims").select("*").eq("organization_id", orgId);

  if (filter === "upcoming") {
    q = q
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });
  } else if (filter === "ongoing") {
    q = q
      .eq("status", "ongoing")
      .order("scheduled_at", { ascending: false });
  } else if (filter === "completed") {
    q = q
      .in("status", ["completed", "cancelled"])
      .order("scheduled_at", { ascending: false })
      .limit(50);
  } else {
    q = q.order("scheduled_at", { ascending: false }).limit(50);
  }

  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

/**
 * Fetch a scrim plus everything the detail page needs in one call.
 *
 * Returns null if the scrim isn't visible to the caller (RLS denial or
 * not found). We join attendances ↔ team_members ↔ profiles client-side
 * because Supabase JS embeds don't expose joined-row types under our
 * hand-written Database shape.
 */
export async function getScrimDetail(
  scrimId: string,
): Promise<ScrimDetail | null> {
  const supabase = await createClient();
  const { data: scrim, error } = await supabase
    .from("scrims")
    .select("*")
    .eq("id", scrimId)
    .maybeSingle();
  if (error || !scrim) return null;

  const [attendancesRes, resultRes, divisionRes, membersRes] =
    await Promise.all([
      supabase.from("scrim_attendances").select("*").eq("scrim_id", scrimId),
      supabase
        .from("scrim_results")
        .select("*")
        .eq("scrim_id", scrimId)
        .maybeSingle(),
      supabase
        .from("divisions")
        .select("name")
        .eq("id", scrim.division_id)
        .maybeSingle(),
      supabase
        .from("team_members")
        .select("user_id, jersey_number, position")
        .eq("organization_id", scrim.organization_id)
        .eq("division_id", scrim.division_id)
        .eq("is_active", true),
    ]);

  const attendances = attendancesRes.data ?? [];
  const members = membersRes.data ?? [];

  // Pull profile display info for the union of (members + anyone who has
  // attendance but is no longer in members table).
  const userIds = Array.from(
    new Set([
      ...members.map((m) => m.user_id),
      ...attendances.map((a) => a.user_id),
    ]),
  );
  const profileMap = new Map<
    string,
    { display_name: string | null; avatar_url: string | null }
  >();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      });
    }
  }

  const memberMap = new Map<string, (typeof members)[number]>(
    members.map((m) => [m.user_id, m]),
  );

  // Build the joined attendance rows: one per active division member.
  // If a member hasn't answered yet, synthesize a pending row.
  const attendanceMap = new Map<string, ScrimAttendance>(
    attendances.map((a) => [a.user_id, a]),
  );
  const rows: ScrimDetail["attendances"] = members.map((m) => {
    const profile = profileMap.get(m.user_id) ?? {
      display_name: null,
      avatar_url: null,
    };
    const att =
      attendanceMap.get(m.user_id) ??
      ({
        id: `pending:${scrimId}:${m.user_id}`,
        scrim_id: scrimId,
        user_id: m.user_id,
        status: "pending" as const,
        note: null,
        updated_at: scrim.created_at,
      } satisfies ScrimAttendance);
    return {
      attendance: att,
      member: {
        user_id: m.user_id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        jersey_number: m.jersey_number,
        position: m.position,
      },
    };
  });

  // Surface attendance rows for users no longer in the active member set
  // (former members) — captain might still want to see their RSVP.
  for (const a of attendances) {
    if (memberMap.has(a.user_id)) continue;
    const profile = profileMap.get(a.user_id) ?? {
      display_name: null,
      avatar_url: null,
    };
    rows.push({
      attendance: a,
      member: {
        user_id: a.user_id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        jersey_number: null,
        position: null,
      },
    });
  }

  // Resolve the caller's own attendance row (if any).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const myAttendance =
    user && attendanceMap.has(user.id)
      ? (attendanceMap.get(user.id) ?? null)
      : null;

  return {
    scrim,
    attendances: rows,
    result: resultRes.data ?? null,
    divisionName: divisionRes.data?.name ?? null,
    myAttendance,
  };
}

export function summarizeAttendance(
  rows: ScrimDetail["attendances"],
): Record<AttendanceStatus, number> {
  const counts: Record<AttendanceStatus, number> = {
    confirmed: 0,
    declined: 0,
    tentative: 0,
    pending: 0,
  };
  for (const r of rows) counts[r.attendance.status] += 1;
  return counts;
}
