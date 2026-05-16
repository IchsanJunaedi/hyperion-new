import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentStage = Database["public"]["Tables"]["tournament_stages"]["Row"];

export interface TournamentWithStages extends Tournament {
  stages: TournamentStage[];
  division_name: string | null;
}

/**
 * List tournaments for an org, grouped by status panels.
 */
export async function listTournaments(orgId: string): Promise<Tournament[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("*")
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

  const [stagesRes, divRes] = await Promise.all([
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
  ]);

  return {
    ...tournament,
    stages: stagesRes.data ?? [],
    division_name: divRes.data?.name ?? null,
  };
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
