import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  computeOverviewStats,
  computeFormatBreakdown,
  computePlayerStats,
  type RawScrimResult,
} from "./computations";

export type { OverviewStats, FormatStat, PlayerStat } from "./computations";

export interface RecentScrim {
  id: string;
  opponent_name: string;
  scheduled_at: string;
  format: string;
  division_name: string | null;
  is_win: boolean | null;
  our_score: number | null;
  opponent_score: number | null;
}

function extractIsWin(scrimResults: unknown): boolean | null {
  if (!scrimResults) return null;
  const arr = Array.isArray(scrimResults) ? scrimResults : [scrimResults];
  const first = arr[0] as { is_win?: boolean | null } | undefined;
  return first?.is_win ?? null;
}

export async function getOverviewStats(orgId: string): Promise<{
  stats: ReturnType<typeof computeOverviewStats>;
  formatBreakdown: ReturnType<typeof computeFormatBreakdown>;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scrims")
    .select("id, format, scrim_results(is_win)")
    .eq("organization_id", orgId)
    .eq("status", "completed");

  const results: RawScrimResult[] = (data ?? []).map((s) => ({
    scrim_id: s.id,
    format: s.format,
    is_win: extractIsWin(s.scrim_results),
  }));

  return {
    stats: computeOverviewStats(results),
    formatBreakdown: computeFormatBreakdown(results),
  };
}

export async function getRecentScrims(orgId: string): Promise<RecentScrim[]> {
  const supabase = await createClient();
  const { data: scrims } = await supabase
    .from("scrims")
    .select(
      "id, opponent_name, scheduled_at, format, division_id, scrim_results(is_win, our_score, opponent_score)",
    )
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(10);

  if (!scrims || scrims.length === 0) return [];

  const divisionIds = [
    ...new Set(scrims.map((s) => s.division_id).filter(Boolean)),
  ] as string[];

  let divisionMap = new Map<string, string>();
  if (divisionIds.length > 0) {
    const { data: divisions } = await supabase
      .from("divisions")
      .select("id, name")
      .in("id", divisionIds);
    divisionMap = new Map((divisions ?? []).map((d) => [d.id, d.name]));
  }

  return scrims.map((s) => {
    const arr = Array.isArray(s.scrim_results)
      ? s.scrim_results
      : [s.scrim_results];
    const result = arr[0] as
      | {
          is_win?: boolean | null;
          our_score?: number | null;
          opponent_score?: number | null;
        }
      | undefined;
    return {
      id: s.id,
      opponent_name: s.opponent_name,
      scheduled_at: s.scheduled_at,
      format: s.format,
      division_name: s.division_id
        ? (divisionMap.get(s.division_id) ?? null)
        : null,
      is_win: result?.is_win ?? null,
      our_score: result?.our_score ?? null,
      opponent_score: result?.opponent_score ?? null,
    };
  });
}

export interface HeroStat {
  hero_name: string;
  picks: number;
  wins: number;
  winRate: number;
}

export interface DraftAnalyticsData {
  byRole: Record<string, HeroStat[]>;
  topOverall: HeroStat[];
}

export async function getDraftAnalytics(orgId: string): Promise<DraftAnalyticsData> {
  const supabase = await createClient();

  // Get completed scrims for this org
  const { data: scrims } = await supabase
    .from("scrims")
    .select("id, scrim_results(is_win)")
    .eq("organization_id", orgId)
    .eq("status", "completed");

  if (!scrims || scrims.length === 0) {
    return { byRole: {}, topOverall: [] };
  }

  const scrimIds = scrims.map((s) => s.id);
  const winMap = new Map<string, boolean | null>(
    scrims.map((s) => {
      const arr = Array.isArray(s.scrim_results) ? s.scrim_results : [s.scrim_results];
      const first = arr[0] as { is_win?: boolean | null } | undefined;
      return [s.id, first?.is_win ?? null];
    }),
  );

  // Only our side picks
  const { data: picks } = await supabase
    .from("scrim_draft_picks")
    .select("scrim_id, role, hero_name")
    .in("scrim_id", scrimIds)
    .eq("side", "our");

  if (!picks || picks.length === 0) return { byRole: {}, topOverall: [] };

  // Aggregate per role
  const roleMap = new Map<string, Map<string, { picks: number; wins: number }>>();
  for (const pick of picks) {
    if (!roleMap.has(pick.role)) roleMap.set(pick.role, new Map());
    const heroMap = roleMap.get(pick.role)!;
    const entry = heroMap.get(pick.hero_name) ?? { picks: 0, wins: 0 };
    entry.picks++;
    if (winMap.get(pick.scrim_id) === true) entry.wins++;
    heroMap.set(pick.hero_name, entry);
  }

  const toStats = (map: Map<string, { picks: number; wins: number }>): HeroStat[] =>
    Array.from(map.entries())
      .map(([hero_name, { picks, wins }]) => ({
        hero_name,
        picks,
        wins,
        winRate: picks === 0 ? 0 : Math.round((wins / picks) * 100),
      }))
      .sort((a, b) => b.picks - a.picks || b.winRate - a.winRate)
      .slice(0, 8);

  const byRole: Record<string, HeroStat[]> = {};
  for (const [role, map] of roleMap.entries()) {
    byRole[role] = toStats(map);
  }

  // Top overall (deduplicate across roles)
  const overallMap = new Map<string, { picks: number; wins: number }>();
  for (const pick of picks) {
    const entry = overallMap.get(pick.hero_name) ?? { picks: 0, wins: 0 };
    entry.picks++;
    if (winMap.get(pick.scrim_id) === true) entry.wins++;
    overallMap.set(pick.hero_name, entry);
  }
  const topOverall = toStats(overallMap);

  return { byRole, topOverall };
}

export async function getPlayerStats(
  orgId: string,
): Promise<ReturnType<typeof computePlayerStats>> {
  const supabase = await createClient();

  // Newest first untuk streak computation
  const { data: scrims } = await supabase
    .from("scrims")
    .select("id, format, scrim_results(is_win)")
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false });

  const results: RawScrimResult[] = (scrims ?? []).map((s) => ({
    scrim_id: s.id,
    format: s.format,
    is_win: extractIsWin(s.scrim_results),
  }));

  if (results.length === 0) return [];

  const scrimIds = results.map((r) => r.scrim_id);

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, jersey_number, position")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .in("role", ["captain", "member"]);

  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);

  const [profilesRes, attendancesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds),
    supabase
      .from("scrim_attendances")
      .select("user_id, scrim_id, status")
      .in("scrim_id", scrimIds)
      .in("user_id", userIds),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p]),
  );

  const players = members.map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      user_id: m.user_id,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      jersey_number: m.jersey_number,
      position: m.position,
    };
  });

  const attendances = (attendancesRes.data ?? []).map((a) => ({
    user_id: a.user_id,
    scrim_id: a.scrim_id,
    status: a.status as "confirmed" | "declined" | "tentative" | "pending",
  }));

  return computePlayerStats(players, attendances, results);
}
