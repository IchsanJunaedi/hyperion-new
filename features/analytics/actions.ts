"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export interface PlayerHeroHistory {
  heroStats: PlayerHeroStatExtended[];
  recentGames: PlayerScrimGame[];
}

export async function fetchPlayerHeroHistory(
  orgId: string,
  userId: string,
): Promise<PlayerHeroHistory> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { heroStats: [], recentGames: [] };

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

    if (!membership) return { heroStats: [], recentGames: [] };
  }

  const admin = createAdminClient();

  // 1. All completed scrims for this org
  const { data: scrims } = await admin
    .from("scrims")
    .select("id, opponent_name, scheduled_at, format, scrim_results(is_win)")
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false });

  if (!scrims?.length) return { heroStats: [], recentGames: [] };

  const scrimIds = scrims.map((s) => s.id);

  // Build scrim result map (overall win/loss)
  const scrimResultMap = new Map<string, boolean | null>();
  for (const s of scrims) {
    const arr = Array.isArray(s.scrim_results) ? s.scrim_results : [s.scrim_results];
    const first = arr[0] as { is_win?: boolean | null } | undefined;
    scrimResultMap.set(s.id, first?.is_win ?? null);
  }

  // 2. Fetch all draft picks for this player across all completed scrims
  const { data: picks } = await admin
    .from("scrim_draft_picks")
    .select("scrim_id, game_number, hero_name, role")
    .in("scrim_id", scrimIds)
    .eq("player_id", userId)
    .eq("side", "our");

  if (!picks?.length) return { heroStats: [], recentGames: [] };

  // 3. Fetch game results to know per-game win/loss
  const { data: gameResults } = await admin
    .from("scrim_game_results")
    .select("scrim_id, game_number, is_win")
    .in("scrim_id", scrimIds);

  const gameWinMap = new Map<string, boolean>(
    (gameResults ?? []).map((g) => [`${g.scrim_id}:${g.game_number}`, g.is_win]),
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

  return { heroStats, recentGames };
}
