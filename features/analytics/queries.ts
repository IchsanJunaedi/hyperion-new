import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  computeOverviewStats,
  computeFormatBreakdown,
  computePlayerStats,
  type RawScrimResult,
} from "./computations";

export type { OverviewStats, FormatStat, PlayerStat } from "./computations";

// ─── Shared types ─────────────────────────────────────────────────────────────

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

export interface HeroStat {
  hero_name: string;
  picks: number;
  wins: number;
  winRate: number;
}

export interface PlayerHeroStat {
  hero_name: string;
  role: string;
  picks: number;
  wins: number;
  winRate: number;
}

export interface EnterprisePlayerStat {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  jersey_number: number | null;
  position: string | null;
  main_role: string | null;
  attendanceRate: number;
  totalPresent: number;
  totalScrims: number;
  winRateWhenPresent: number;
  winsWhenPresent: number;
  scrimsWhenPresent: number;
  streak: number;
  avgRating: number | null;
  heroPool: PlayerHeroStat[];
}

export interface DraftAnalyticsData {
  byRole: Record<string, HeroStat[]>;
  topOverall: HeroStat[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractIsWin(scrimResults: unknown): boolean | null {
  if (!scrimResults) return null;
  const arr = Array.isArray(scrimResults) ? scrimResults : [scrimResults];
  const first = arr[0] as { is_win?: boolean | null } | undefined;
  return first?.is_win ?? null;
}

function toHeroStats(
  map: Map<string, { picks: number; wins: number; role?: string }>,
  topN = 8,
): HeroStat[] {
  return Array.from(map.entries())
    .map(([hero_name, { picks, wins }]) => ({
      hero_name,
      picks,
      wins,
      winRate: picks === 0 ? 0 : Math.round((wins / picks) * 100),
    }))
    .sort((a, b) => b.picks - a.picks || b.winRate - a.winRate)
    .slice(0, topN);
}

// ─── Overview ─────────────────────────────────────────────────────────────────

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

// ─── Recent scrims ────────────────────────────────────────────────────────────

export async function getRecentScrims(orgId: string): Promise<RecentScrim[]> {
  const supabase = await createClient();
  const { data: scrims } = await supabase
    .from("scrims")
    .select("id, opponent_name, scheduled_at, format, division_id, scrim_results(is_win, our_score, opponent_score)")
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(10);

  if (!scrims?.length) return [];

  const divisionIds = [...new Set(scrims.map((s) => s.division_id).filter(Boolean))] as string[];
  let divisionMap = new Map<string, string>();
  if (divisionIds.length > 0) {
    const { data: divs } = await supabase
      .from("divisions")
      .select("id, name")
      .in("id", divisionIds);
    divisionMap = new Map((divs ?? []).map((d) => [d.id, d.name]));
  }

  return scrims.map((s) => {
    const arr = Array.isArray(s.scrim_results) ? s.scrim_results : [s.scrim_results];
    const r = arr[0] as { is_win?: boolean | null; our_score?: number | null; opponent_score?: number | null } | undefined;
    return {
      id: s.id,
      opponent_name: s.opponent_name,
      scheduled_at: s.scheduled_at,
      format: s.format,
      division_name: s.division_id ? (divisionMap.get(s.division_id) ?? null) : null,
      is_win: r?.is_win ?? null,
      our_score: r?.our_score ?? null,
      opponent_score: r?.opponent_score ?? null,
    };
  });
}

// ─── Hero Statistics (RPC-backed) ─────────────────────────────────────────────

export interface HeroStatRow {
  hero_name: string;
  pick_total: number;
  pick_wins: number;
  pick_losses: number;
  pick_wr: number;
  pick_pct: number;
  team_ban_total: number;
  team_ban_pct: number;
  enemy_ban_total: number;
  enemy_ban_pct: number;
  pb_total: number;
  pb_pct: number;
}

export interface HeroDetailPlayerRow {
  display_name: string;
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface HeroDetailHeroRow {
  hero_name: string;
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface HeroDetailData {
  played_by_player: HeroDetailPlayerRow[];
  played_with: HeroDetailHeroRow[];
  played_against: HeroDetailHeroRow[];
}

export async function getHeroStatistics(orgId: string): Promise<HeroStatRow[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_hero_statistics", { p_org_id: orgId });
  if (error) throw new Error(error.message);
  return (data ?? []) as HeroStatRow[];
}

export async function getHeroDetail(orgId: string, heroName: string): Promise<HeroDetailData> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_hero_detail", {
    p_org_id: orgId,
    p_hero_name: heroName,
  });
  if (error) throw new Error(error.message);
  const result = data as HeroDetailData | null;
  return {
    played_by_player: result?.played_by_player ?? [],
    played_with: result?.played_with ?? [],
    played_against: result?.played_against ?? [],
  };
}

// ─── Draft Analytics (per-game win rate — more accurate for BO formats) ───────

export async function getDraftAnalytics(orgId: string): Promise<DraftAnalyticsData> {
  const supabase = await createClient();

  const { data: scrims } = await supabase
    .from("scrims")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "completed");

  if (!scrims?.length) return { byRole: {}, topOverall: [] };

  const scrimIds = scrims.map((s) => s.id);

  // Use per-game results (more accurate than overall scrim result in BO formats)
  const [picksRes, gameResultsRes] = await Promise.all([
    supabase
      .from("scrim_draft_picks")
      .select("scrim_id, game_number, role, hero_name")
      .in("scrim_id", scrimIds)
      .eq("side", "our"),
    supabase
      .from("scrim_game_results")
      .select("scrim_id, game_number, is_win")
      .in("scrim_id", scrimIds),
  ]);

  const picks = picksRes.data ?? [];
  if (!picks.length) return { byRole: {}, topOverall: [] };

  // `${scrimId}:${gameNumber}` → is_win
  const gameWinMap = new Map<string, boolean>(
    (gameResultsRes.data ?? []).map((g) => [`${g.scrim_id}:${g.game_number}`, g.is_win]),
  );

  const roleMap = new Map<string, Map<string, { picks: number; wins: number }>>();
  const overallMap = new Map<string, { picks: number; wins: number }>();

  for (const pick of picks) {
    const won = gameWinMap.get(`${pick.scrim_id}:${pick.game_number}`) === true;

    // Per-role
    if (!roleMap.has(pick.role)) roleMap.set(pick.role, new Map());
    const roleHeroMap = roleMap.get(pick.role)!;
    const re = roleHeroMap.get(pick.hero_name) ?? { picks: 0, wins: 0 };
    re.picks++;
    if (won) re.wins++;
    roleHeroMap.set(pick.hero_name, re);

    // Overall
    const oe = overallMap.get(pick.hero_name) ?? { picks: 0, wins: 0 };
    oe.picks++;
    if (won) oe.wins++;
    overallMap.set(pick.hero_name, oe);
  }

  const byRole: Record<string, HeroStat[]> = {};
  for (const [role, map] of roleMap.entries()) byRole[role] = toHeroStats(map, 5);

  return { byRole, topOverall: toHeroStats(overallMap, 10) };
}

// ─── Enterprise Player Stats (rating + hero pool) ─────────────────────────────

export async function getEnterprisePlayerStats(orgId: string): Promise<EnterprisePlayerStat[]> {
  const supabase = await createClient();

  // All completed scrims, newest first (for streak)
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

  // Roster: captains + members only
  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, jersey_number, position, main_role")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .in("role", ["captain", "member"]);

  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);

  // Batch-fetch everything
  const [profilesRes, attendancesRes, gameResultsRes, picksRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
    supabase
      .from("scrim_attendances")
      .select("user_id, scrim_id, status, rating, coach_notes")
      .in("scrim_id", scrimIds)
      .in("user_id", userIds),
    supabase
      .from("scrim_game_results")
      .select("scrim_id, game_number, is_win")
      .in("scrim_id", scrimIds),
    supabase
      .from("scrim_draft_picks")
      .select("player_id, hero_name, role, scrim_id, game_number")
      .in("scrim_id", scrimIds)
      .eq("side", "our")
      .not("player_id", "is", null),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]),
  );

  // Per-game win map
  const gameWinMap = new Map<string, boolean>(
    (gameResultsRes.data ?? []).map((g) => [`${g.scrim_id}:${g.game_number}`, g.is_win]),
  );

  // Avg rating per player
  const ratingByPlayer = new Map<string, { sum: number; count: number }>();
  for (const a of attendancesRes.data ?? []) {
    if (a.rating == null) continue;
    const cur = ratingByPlayer.get(a.user_id) ?? { sum: 0, count: 0 };
    cur.sum += a.rating;
    cur.count++;
    ratingByPlayer.set(a.user_id, cur);
  }

  // Hero pool per player: player_id → Map<`hero:role` → { picks, wins, role }>
  const playerHeroMap = new Map<string, Map<string, { picks: number; wins: number; role: string; hero: string }>>();
  for (const pick of picksRes.data ?? []) {
    if (!pick.player_id) continue;
    if (!playerHeroMap.has(pick.player_id)) playerHeroMap.set(pick.player_id, new Map());
    const pMap = playerHeroMap.get(pick.player_id)!;
    const key = `${pick.hero_name}:${pick.role}`;
    const entry = pMap.get(key) ?? { picks: 0, wins: 0, role: pick.role, hero: pick.hero_name };
    entry.picks++;
    if (gameWinMap.get(`${pick.scrim_id}:${pick.game_number}`) === true) entry.wins++;
    pMap.set(key, entry);
  }

  // Base stats via existing computation
  const players = members.map((m) => ({
    user_id: m.user_id,
    display_name: profileMap.get(m.user_id)?.display_name ?? null,
    avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
    jersey_number: m.jersey_number,
    position: m.position,
    main_role: m.main_role,
  }));

  const attendances = (attendancesRes.data ?? []).map((a) => ({
    user_id: a.user_id,
    scrim_id: a.scrim_id,
    status: a.status as "confirmed" | "declined" | "tentative" | "pending",
  }));

  const mainRoleMap = new Map(members.map((m) => [m.user_id, m.main_role ?? null]));
  const baseStats = computePlayerStats(players, attendances, results);

  return baseStats.map((base) => {
    const ratingData = ratingByPlayer.get(base.user_id);
    const avgRating =
      ratingData && ratingData.count > 0
        ? Math.round((ratingData.sum / ratingData.count) * 10) / 10
        : null;

    const heroMap = playerHeroMap.get(base.user_id);
    const heroPool: PlayerHeroStat[] = heroMap
      ? Array.from(heroMap.values())
          .map(({ hero, role, picks, wins }) => ({
            hero_name: hero,
            role,
            picks,
            wins,
            winRate: picks === 0 ? 0 : Math.round((wins / picks) * 100),
          }))
          .sort((a, b) => b.picks - a.picks)
          .slice(0, 5)
      : [];

    return { ...base, main_role: mainRoleMap.get(base.user_id) ?? null, avgRating, heroPool };
  });
}
