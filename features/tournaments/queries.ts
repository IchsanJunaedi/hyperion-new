import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentStage = Database["public"]["Tables"]["tournament_stages"]["Row"];

export interface TournamentDraftPick {
  id: string;
  game_result_id: string;
  hero_name: string;
  side: "our" | "opponent";
  pick_type: "pick" | "ban";
  role: string | null;
  created_at: string;
}

export interface TournamentGameResult {
  id: string;
  tournament_match_id: string;
  game_number: number;
  is_win: boolean | null;
  our_score: number | null;
  opponent_score: number | null;
  notes: string | null;
  created_at: string;
  draft_picks: TournamentDraftPick[];
}

export interface TournamentMatch {
  id: string;
  stage_id: string;
  round_label: string;
  opponent_name: string | null;
  our_score: number | null;
  opponent_score: number | null;
  is_win: boolean | null;
  notes: string | null;
  played_at: string | null;
  created_at: string;
  match_format: string | null;
  scheduled_at: string | null;
  opponent_id: string | null;
  game_results: TournamentGameResult[];
}

export interface TournamentStageWithMatches extends TournamentStage {
  matches: TournamentMatch[];
}

export interface TournamentResult {
  placement: number | null;
  prize_earned: string | null;
  notes: string | null;
}

export interface TournamentWithStages extends Tournament {
  stages: TournamentStageWithMatches[];
  division_name: string | null;
  result: TournamentResult | null;
}

/**
 * List tournaments for an org, grouped by status panels.
 */
export async function listTournaments(orgId: string): Promise<Tournament[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select(
      "id, organization_id, division_id, name, status, start_date, start_time, end_date, link, organizer, prize_pool, registration_deadline, registration_fee, registration_url, is_registered, bracket_link, bracket_file_path, notes, created_by, created_at, day_reminder_sent_at, h1_reminder_sent_at, h30_reminder_sent_at, show_in_hero, show_on_schedule, tech_meet_date, tech_meet_time, tech_meet_link, location, location_type, patch_id",
    )
    .eq("organization_id", orgId)
    .order("start_date", { ascending: false })
    .limit(100);
  return data ?? [];
}

/**
 * Get a single tournament with its stages.
 */
export async function getTournamentDetail(
  tournamentId: string,
): Promise<TournamentWithStages | null> {
  const supabase = await createClient();
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .maybeSingle();
  if (!tournament) return null;

  const [stagesRes, divRes, resultRes] = await Promise.all([
    supabase
      .from("tournament_stages")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("divisions")
      .select("name")
      .eq("id", tournament.division_id)
      .maybeSingle(),
    supabase
      .from("tournament_results")
      .select("placement, prize_earned, notes")
      .eq("tournament_id", tournamentId)
      .maybeSingle(),
  ]);

  const stages = stagesRes.data ?? [];

  // Fetch matches for all stages
  const matchesByStage = new Map<string, TournamentMatch[]>();
  if (stages.length > 0) {
    const stageIds = stages.map((s) => s.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matches } = await (supabase as any)
      .from("tournament_matches")
      .select("*")
      .in("stage_id", stageIds)
      .order("created_at", { ascending: true });

    if (matches && matches.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchIds = (matches as any[]).map(m => m.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: gameResults } = await (supabase as any)
        .from('tournament_game_results')
        .select('id, tournament_match_id, game_number, is_win, our_score, opponent_score, notes, created_at')
        .in('tournament_match_id', matchIds)
        .order('game_number', { ascending: true })
        .limit(200);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gameResultIds = (gameResults ?? []).map((g: any) => g.id);
      const draftPicksByGame = new Map<string, TournamentDraftPick[]>();
      if (gameResultIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: picks } = await (supabase as any)
          .from('tournament_draft_picks')
          .select('id, game_result_id, hero_name, side, pick_type, role, player_id, created_at')
          .in('game_result_id', gameResultIds)
          .limit(1000);
        for (const p of (picks ?? []) as TournamentDraftPick[]) {
          const arr = draftPicksByGame.get(p.game_result_id) ?? [];
          arr.push(p);
          draftPicksByGame.set(p.game_result_id, arr);
        }
      }
      
      const gameResultsByMatch = new Map<string, TournamentGameResult[]>();
      for (const g of (gameResults ?? []) as TournamentGameResult[]) {
        const withPicks = { ...g, draft_picks: draftPicksByGame.get(g.id) ?? [] };
        const arr = gameResultsByMatch.get(g.tournament_match_id) ?? [];
        arr.push(withPicks);
        gameResultsByMatch.set(g.tournament_match_id, arr);
      }
      
      // Attach game_results to each match
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const m of (matches as any[])) {
        m.game_results = gameResultsByMatch.get(m.id) ?? [];
      }
    }

    for (const m of (matches ?? []) as TournamentMatch[]) {
      const arr = matchesByStage.get(m.stage_id) ?? [];
      arr.push(m);
      matchesByStage.set(m.stage_id, arr);
    }
  }

  return {
    ...tournament,
    stages: stages.map((s) => ({
      ...s,
      matches: matchesByStage.get(s.id) ?? [],
    })),
    division_name: divRes.data?.name ?? null,
    result: resultRes.data ?? null,
  };
}

/**
 * Batch-fetch placements for a list of tournament IDs.
 * Returns a Map of tournament_id → placement (null if not recorded).
 */
export async function listTournamentPlacements(
  tournamentIds: string[],
): Promise<Map<string, { placement: number | null; notes: string | null }>> {
  if (tournamentIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournament_results")
    .select("tournament_id, placement, notes")
    .in("tournament_id", tournamentIds)
    .limit(200);
  const map = new Map<string, { placement: number | null; notes: string | null }>();
  for (const row of data ?? []) {
    map.set(row.tournament_id, {
      placement: row.placement,
      notes: row.notes,
    });
  }
  return map;
}

/**
 * Categorize tournaments into panels.
 * - upcoming: status upcoming (belum daftar)
 * - registered: status ongoing + start_date belum lewat (terdaftar, countdown)
 * - ongoing: status ongoing + start_date sudah lewat (sedang berlangsung)
 * - completed/cancelled: selesai/batal
 */
export function categorizeTournaments(tournaments: Tournament[]) {
  const now = new Date();
  const upcoming: Tournament[] = [];
  const registered: Tournament[] = [];
  const ongoing: Tournament[] = [];
  const completed: Tournament[] = [];
  const cancelled: Tournament[] = [];

  for (const t of tournaments) {
    if (t.status === "cancelled") {
      cancelled.push(t);
    } else if (t.status === "completed") {
      completed.push(t);
    } else if (t.status === "ongoing") {
      const startDate = new Date(t.start_date);
      if (startDate.getTime() > now.getTime()) {
        registered.push(t);
      } else {
        ongoing.push(t);
      }
    } else {
      // upcoming or scheduled
      upcoming.push(t);
    }
  }

  return { upcoming, registered, ongoing, completed, cancelled };
}

/**
 * Get the next upcoming or active tournament match for a team.
 * Used on home page to show active match info in countdown.
 * Returns: match info + tournament name, or null if none.
 */
export async function getNextActiveTournamentMatch(orgId: string, teamId: string | null): Promise<{
  tournamentId: string;
  tournamentName: string;
  roundLabel: string;
  opponentName: string | null;
  matchFormat: string | null;
  scheduledAt: string | null;
  stageScheduledAt: string;
} | null> {
  const supabase = await createClient();
  // Find ongoing tournaments for this org
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, division_id')
    .eq('organization_id', orgId)
    .eq('status', 'ongoing')
    .limit(10);
  if (error) console.error('[getNextActiveTournamentMatch]', error);
  if (!tournaments || tournaments.length === 0) return null;

  // Filter by team's division if teamId provided
  const filteredTournaments = tournaments;
  if (teamId) {
    // teamId here is actually divisionId context — just use all ongoing for now
    // since we don't have direct division→tournament membership query
  }

  const tournamentIds = filteredTournaments.map(t => t.id);

  // Get stages for these tournaments
  const { data: stages } = await supabase
    .from('tournament_stages')
    .select('id, tournament_id, stage_name, scheduled_at, is_completed')
    .in('tournament_id', tournamentIds)
    .eq('is_completed', false)
    .order('scheduled_at', { ascending: true })
    .limit(20);

  if (!stages || stages.length === 0) return null;

  const stageIds = stages.map(s => s.id);

  // Get matches without results (is_win is null = no result yet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches } = await (supabase as any)
    .from('tournament_matches')
    .select('id, stage_id, round_label, opponent_name, match_format, scheduled_at')
    .in('stage_id', stageIds)
    .is('is_win', null)
    .order('created_at', { ascending: true })
    .limit(20);

  if (!matches || matches.length === 0) return null;

  // Pick the earliest match (by scheduled_at if set, else stage scheduled_at)
  const stageMap = new Map(stages.map(s => [s.id, s]));
  const tourMap = new Map(filteredTournaments.map(t => [t.id, t]));

  // Sort matches by effective time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = (matches as any[]).sort((a, b) => {
    const aTime = a.scheduled_at ?? stageMap.get(a.stage_id)?.scheduled_at ?? '';
    const bTime = b.scheduled_at ?? stageMap.get(b.stage_id)?.scheduled_at ?? '';
    return aTime.localeCompare(bTime);
  });

  const first = sorted[0];
  const stage = stageMap.get(first.stage_id);
  const tournament = tourMap.get(stage?.tournament_id ?? '');

  if (!stage || !tournament) return null;

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    roundLabel: first.round_label,
    opponentName: first.opponent_name ?? null,
    matchFormat: first.match_format ?? null,
    scheduledAt: first.scheduled_at ?? null,
    stageScheduledAt: stage.scheduled_at,
  };
}
