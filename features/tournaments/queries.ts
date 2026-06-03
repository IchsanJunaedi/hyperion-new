import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentStage = Database["public"]["Tables"]["tournament_stages"]["Row"];

export interface TournamentMatch {
  id: string;
  stage_id: string;
  round_label: string;
  our_score: number | null;
  opponent_score: number | null;
  is_win: boolean | null;
  notes: string | null;
  played_at: string | null;
  created_at: string;
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
      "id, organization_id, division_id, name, status, start_date, start_time, end_date, link, organizer, prize_pool, registration_deadline, registration_fee, registration_url, is_registered, bracket_link, bracket_file_path, notes, created_by, created_at, day_reminder_sent_at, h1_reminder_sent_at, h30_reminder_sent_at",
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
): Promise<Map<string, number | null>> {
  if (tournamentIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournament_results")
    .select("tournament_id, placement")
    .in("tournament_id", tournamentIds)
    .limit(200);
  const map = new Map<string, number | null>();
  for (const row of data ?? []) {
    map.set(row.tournament_id, row.placement);
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
