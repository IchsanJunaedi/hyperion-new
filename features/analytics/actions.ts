"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getHeroStatistics,
  getHeroDetail,
  getOpponentSummary,
  getPlayerTrendByMonth,
  type HeroStatRow,
  type HeroDetailData,
  type OpponentSummary,
  type PlayerMonthlyTrend,
} from "@/features/analytics/queries";

export interface PlayerHeroStatExtended {
  hero_name: string;
  role: string;
  picks: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface PlayerScrimGame {
  scrim_id: string;
  opponent_name: string;
  scheduled_at: string;
  format: string;
  scrim_is_win: boolean | null;
  game_number: number;
  game_is_win: boolean;
  hero_name: string;
  role: string;
}

export interface PlayerRatingEntry {
  scrim_id: string;
  opponent_name: string;
  scheduled_at: string;
  rating: number;
  coach_notes: string | null;
}

export interface PlayerHeroHistory {
  heroStats: PlayerHeroStatExtended[];
  recentGames: PlayerScrimGame[];
  ratingHistory: PlayerRatingEntry[];
}

export async function fetchPlayerHeroHistory(
  orgId: string,
  userId: string,
): Promise<PlayerHeroHistory> {
  const empty: PlayerHeroHistory = { heroStats: [], recentGames: [], ratingHistory: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return empty;

  // Validate: caller must be a member of this org (or owner)
  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);

  if (!isOwner) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) return empty;
  }

  const admin = createAdminClient();

  // 1. All completed scrims for this org
  const { data: scrims } = await admin
    .from("scrims")
    .select("id, opponent_name, scheduled_at, format, scrim_results(is_win)")
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false });

  if (!scrims?.length) return empty;

  const scrimIds = scrims.map((s) => s.id);

  // Build scrim result map (overall win/loss)
  const scrimResultMap = new Map<string, boolean | null>();
  for (const s of scrims) {
    const arr = Array.isArray(s.scrim_results) ? s.scrim_results : [s.scrim_results];
    const first = arr[0] as { is_win?: boolean | null } | undefined;
    scrimResultMap.set(s.id, first?.is_win ?? null);
  }

  // 2. Parallel: draft picks + game results + attendances for this player
  const [picksRes, gameResultsRes, attendancesRes] = await Promise.all([
    admin
      .from("scrim_draft_picks")
      .select("scrim_id, game_number, hero_name, role")
      .in("scrim_id", scrimIds)
      .eq("player_id", userId)
      .eq("side", "our"),
    admin
      .from("scrim_game_results")
      .select("scrim_id, game_number, is_win")
      .in("scrim_id", scrimIds),
    admin
      .from("scrim_attendances")
      .select("scrim_id, rating, coach_notes")
      .in("scrim_id", scrimIds)
      .eq("user_id", userId),
  ]);

  // 3. Build rating history (chronological, rated entries only, last 15)
  const attendanceByScrim = new Map(
    (attendancesRes.data ?? []).map((a) => [a.scrim_id, a]),
  );
  const ratingHistory: PlayerRatingEntry[] = [...scrims]
    .reverse() // oldest first for left-to-right trend
    .reduce<PlayerRatingEntry[]>((acc, s) => {
      const att = attendanceByScrim.get(s.id);
      if (att?.rating != null) {
        acc.push({
          scrim_id: s.id,
          opponent_name: s.opponent_name,
          scheduled_at: s.scheduled_at,
          rating: att.rating as number,
          coach_notes: (att.coach_notes as string | null) ?? null,
        });
      }
      return acc;
    }, [])
    .slice(-15); // keep at most 15 most recent rated entries

  const picks = picksRes.data ?? [];
  if (!picks.length) return { heroStats: [], recentGames: [], ratingHistory };

  const gameWinMap = new Map<string, boolean>(
    (gameResultsRes.data ?? []).map((g) => [`${g.scrim_id}:${g.game_number}`, g.is_win]),
  );

  // ── Aggregate hero stats ──────────────────────────────────────────────────
  // key: `hero_name:role`
  const heroMap = new Map<string, { picks: number; wins: number; losses: number; role: string; hero: string }>();

  for (const pick of picks) {
    const key = `${pick.hero_name}:${pick.role}`;
    const entry = heroMap.get(key) ?? { picks: 0, wins: 0, losses: 0, role: pick.role, hero: pick.hero_name };
    entry.picks++;
    const gameKey = `${pick.scrim_id}:${pick.game_number}`;
    const gameWin = gameWinMap.get(gameKey);
    if (gameWin === true) entry.wins++;
    else if (gameWin === false) entry.losses++;
    heroMap.set(key, entry);
  }

  const heroStats: PlayerHeroStatExtended[] = Array.from(heroMap.values())
    .map(({ hero, role, picks: p, wins, losses }) => ({
      hero_name: hero,
      role,
      picks: p,
      wins,
      losses,
      winRate: p === 0 ? 0 : Math.round((wins / p) * 100),
    }))
    .sort((a, b) => b.picks - a.picks || b.winRate - a.winRate);

  // ── Build per-game scrim history ──────────────────────────────────────────
  const scrimMetaMap = new Map(scrims.map((s) => [s.id, s]));

  const rawGames: PlayerScrimGame[] = [];
  for (const pick of picks) {
    const scrim = scrimMetaMap.get(pick.scrim_id);
    if (!scrim) continue;
    const gameKey = `${pick.scrim_id}:${pick.game_number}`;
    const game_is_win = gameWinMap.get(gameKey) ?? false;
    rawGames.push({
      scrim_id: pick.scrim_id,
      opponent_name: scrim.opponent_name,
      scheduled_at: scrim.scheduled_at,
      format: scrim.format as string,
      scrim_is_win: scrimResultMap.get(pick.scrim_id) ?? null,
      game_number: pick.game_number,
      game_is_win,
      hero_name: pick.hero_name,
      role: pick.role,
    });
  }

  const recentGames: PlayerScrimGame[] = rawGames
    .sort((a, b) => {
      const dateDiff = new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.game_number - b.game_number;
    })
    .slice(0, 30);

  return { heroStats, recentGames, ratingHistory };
}

// ─── Hero Statistics server actions (lazy-load for StatisticsTab) ─────────────

export async function getHeroStatisticsAction(
  orgId: string,
  patchId?: string | null,
): Promise<{ ok: true; data: HeroStatRow[] } | { ok: false; message: string }> {
  try {
    const data = await getHeroStatistics(orgId, patchId);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Gagal memuat statistik hero" };
  }
}
 
export async function getHeroDetailAction(
  orgId: string,
  heroName: string,
  patchId?: string | null,
): Promise<{ ok: true; data: HeroDetailData } | { ok: false; message: string }> {
  try {
    const data = await getHeroDetail(orgId, heroName, patchId);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Gagal memuat detail hero" };
  }
}
 
export async function getOpponentSummaryAction(
  orgId: string,
  patchId?: string | null,
): Promise<{ ok: true; data: OpponentSummary[] } | { ok: false; message: string }> {
  try {
    const data = await getOpponentSummary(orgId, patchId);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Gagal memuat data lawan" };
  }
}

export async function getPlayerTrendAction(
  orgId: string,
  userId: string,
): Promise<{ ok: true; data: PlayerMonthlyTrend[] } | { ok: false; message: string }> {
  try {
    const data = await getPlayerTrendByMonth(orgId, userId);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Gagal memuat tren player" };
  }
}
