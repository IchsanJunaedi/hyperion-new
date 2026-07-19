import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { InteractiveBackground } from "@/components/landing/InteractiveBackground";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicTournamentJourney } from "@/features/tournaments/components/PublicTournamentJourney";
import type { TournamentMatch, TournamentStageWithMatches, TournamentGameResult, TournamentDraftPick } from "@/features/tournaments/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("tournaments")
    .select("name")
    .eq("id", p.id)
    .single();

  return {
    title: data ? `${data.name} — Hyperion Schedule` : "Tournament Detail",
  };
}

export default async function PublicTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const admin = createAdminClient();
  
  const { data: tournament } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, status, organizer, prize_pool, registration_url, show_on_schedule, is_registered, divisions(name, game)")
    .eq("id", p.id)
    .maybeSingle();

  if (!tournament || !tournament.show_on_schedule || !tournament.is_registered) {
    notFound();
  }

  // Fetch stages
  const { data: stagesData } = await admin
    .from("tournament_stages")
    .select("*")
    .eq("tournament_id", tournament.id)
    .order("scheduled_at", { ascending: true });

  const stages = stagesData ?? [];
  const matchesByStage = new Map<string, TournamentMatch[]>();

  if (stages.length > 0) {
    const stageIds = stages.map((s) => s.id);
    const { data: matches } = await admin
      .from("tournament_matches")
      .select("*")
      .in("stage_id", stageIds)
      .order("created_at", { ascending: true });

    if (matches && matches.length > 0) {
      const matchIds = (matches as unknown as TournamentMatch[]).map((m) => m.id);
      const { data: gameResults } = await admin
        .from('tournament_game_results')
        .select('id, tournament_match_id, game_number, is_win, our_score, opponent_score, notes, created_at')
        .in('tournament_match_id', matchIds)
        .order('game_number', { ascending: true })
        .limit(200);

      const gameResultIds = (gameResults ?? []).map((g) => g.id);
      const draftPicksByGame = new Map<string, TournamentDraftPick[]>();
      
      if (gameResultIds.length > 0) {
        const { data: picks } = await admin
          .from('tournament_draft_picks')
          .select('id, game_result_id, hero_name, side, pick_type, role, created_at')
          .in('game_result_id', gameResultIds)
          .limit(1000);
          
        for (const pick of (picks ?? []) as TournamentDraftPick[]) {
          const arr = draftPicksByGame.get(pick.game_result_id) ?? [];
          arr.push(pick);
          draftPicksByGame.set(pick.game_result_id, arr);
        }
      }

      const gameResultsByMatch = new Map<string, TournamentGameResult[]>();
      for (const g of (gameResults ?? []) as TournamentGameResult[]) {
        const withPicks = { ...g, draft_picks: draftPicksByGame.get(g.id) ?? [] };
        const arr = gameResultsByMatch.get(g.tournament_match_id) ?? [];
        arr.push(withPicks);
        gameResultsByMatch.set(g.tournament_match_id, arr);
      }

      for (const m of (matches as unknown as TournamentMatch[])) {
        m.game_results = gameResultsByMatch.get(m.id) ?? [];
      }
    }

    for (const m of (matches ?? []) as TournamentMatch[]) {
      const arr = matchesByStage.get(m.stage_id) ?? [];
      arr.push(m);
      matchesByStage.set(m.stage_id, arr);
    }
  }

  const stagesWithMatches: TournamentStageWithMatches[] = stages.map((s) => ({
    ...s,
    matches: matchesByStage.get(s.id) ?? [],
  }));

  const divData = tournament.divisions as unknown as { game?: string; name?: string };
  const game = divData?.game;
  const divisionName = divData?.name;

  return (
    <>
      <Header />
      <main className="relative min-h-screen bg-[#040D1C] overflow-hidden pt-24 pb-20 px-6 sm:px-10 lg:px-16">
        <InteractiveBackground />
        
        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left border-b border-white/10 pb-8">
            <h1 className="font-bebas text-5xl sm:text-7xl font-black uppercase tracking-wide text-white leading-none">
              {tournament.name}
            </h1>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start items-center gap-3 text-sm text-[#9B9A97]">
              {game && (
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1">
                  {game}
                </span>
              )}
              {divisionName && divisionName !== game && (
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1">
                  {divisionName}
                </span>
              )}
            </div>
          </div>

          {/* Bracket / Journey */}
          <div>
            <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-white/50">
              Perjalanan Turnamen
            </h2>
            <div className="rounded-2xl border border-white/10 bg-slate-800/40 backdrop-blur-md p-6 sm:p-8">
              {stagesWithMatches.length > 0 ? (
                <PublicTournamentJourney stages={stagesWithMatches} tournamentName={tournament.name} />
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-white/40">Belum ada perjalanan turnamen.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
