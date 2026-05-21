import { ArrowLeft, Swords, Shield } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getScrimDetail } from "@/features/scrim/queries";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  exp_lane: "EXP",
  jungler: "JGL",
  mid_lane: "MID",
  gold_lane: "GOLD",
  roamer: "ROAM",
};

const ROLE_ORDER = ["exp_lane", "jungler", "mid_lane", "gold_lane", "roamer"];

interface ScrimResultsPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function ScrimResultsPage({ params }: ScrimResultsPageProps) {
  const { "team-slug": slug, id } = await params;
  const detail = await getScrimDetail(id);
  if (!detail) notFound();

  const { scrim, result } = detail;

  const admin = createAdminClient();

  const [{ data: gameResults }, { data: draftPicks }] = await Promise.all([
    admin
      .from("scrim_game_results")
      .select("*")
      .eq("scrim_id", id)
      .order("game_number", { ascending: true }),
    admin
      .from("scrim_draft_picks")
      .select("*")
      .eq("scrim_id", id)
      .order("game_number", { ascending: true }),
  ]);

  // Get signed URLs for game screenshots
  const gamesWithUrls = await Promise.all(
    (gameResults ?? []).map(async (g) => {
      let signedUrl: string | null = null;
      if (g.image_url) {
        const { data } = await admin.storage
          .from("org-private")
          .createSignedUrl(g.image_url, 3600);
        signedUrl = data?.signedUrl ?? null;
      }
      return { ...g, signedUrl };
    }),
  );

  // Group draft picks by game_number → side → role
  type DraftPick = { role: string; hero_name: string; player_id: string | null };
  const draftByGame: Record<number, { our: DraftPick[]; enemy: DraftPick[] }> = {};
  for (const pick of draftPicks ?? []) {
    let gameDraft = draftByGame[pick.game_number];
    if (!gameDraft) {
      gameDraft = { our: [], enemy: [] };
      draftByGame[pick.game_number] = gameDraft;
    }
    if (pick.side === "our") {
      gameDraft.our.push({ role: pick.role, hero_name: pick.hero_name, player_id: pick.player_id });
    } else {
      gameDraft.enemy.push({ role: pick.role, hero_name: pick.hero_name, player_id: pick.player_id });
    }
  }

  const wins = gamesWithUrls.filter((g) => g.is_win).length;
  const losses = gamesWithUrls.filter((g) => !g.is_win).length;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      {/* Back */}
      <div className="flex justify-start">
        <Link
          href={`/${slug}/scrim/${id}`}
          className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke detail scrim
        </Link>
      </div>

      {/* Header */}
      <div className="mx-auto max-w-2xl w-full space-y-2">
        <h1 className="text-2xl font-bold text-white sm:text-3xl tracking-tight">
          Hasil Pertandingan
        </h1>
        <p className="text-sm text-white/50">
          vs {scrim.opponent_name} · {scrim.format.toUpperCase()}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-3xl font-bold text-white">{wins}</span>
          <span className="text-xl text-white/30">—</span>
          <span className="text-3xl font-bold text-white">{losses}</span>
          <span className={`ml-3 text-sm font-semibold uppercase tracking-wide ${
            wins > losses ? "text-green-400" : wins < losses ? "text-red-400" : "text-white/40"
          }`}>
            {wins > losses ? "Menang" : wins < losses ? "Kalah" : "Imbang"}
          </span>
        </div>
      </div>

      {/* Per-game results */}
      <div className="space-y-4 mx-auto max-w-2xl w-full">
        {gamesWithUrls.map((game) => {
          const draft = draftByGame[game.game_number];
          const ourPicks = draft?.our ?? [];
          const enemyPicks = draft?.enemy ?? [];
          const hasDraft = ourPicks.length > 0 || enemyPicks.length > 0;

          return (
            <div
              key={game.id}
              className="rounded-xl border border-white/10 bg-zinc-900/40 overflow-hidden"
            >
              {/* Game header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
                <h3 className="text-sm font-semibold text-white">Game {game.game_number}</h3>
                <div className={`text-xs font-semibold ${
                  game.is_win
                    ? "text-green-400"
                    : "text-red-400"
                }`}>
                  {game.is_win ? "Menang" : "Kalah"}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Draft picks */}
                {hasDraft && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Our team */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Shield className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-400">
                          Tim Kita
                        </span>
                      </div>
                      {ROLE_ORDER.map((role) => {
                        const pick = ourPicks.find((p) => p.role === role);
                        return (
                          <div key={role} className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 w-9 shrink-0">
                              {ROLE_LABELS[role] ?? role}
                            </span>
                            <span className={`text-xs font-medium truncate ${pick ? "text-white/90" : "text-white/20"}`}>
                              {pick?.hero_name ?? "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Enemy team */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Swords className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-red-400">
                          Lawan
                        </span>
                      </div>
                      {ROLE_ORDER.map((role) => {
                        const pick = enemyPicks.find((p) => p.role === role);
                        return (
                          <div key={role} className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 w-9 shrink-0">
                              {ROLE_LABELS[role] ?? role}
                            </span>
                            <span className={`text-xs font-medium truncate ${pick ? "text-white/90" : "text-white/20"}`}>
                              {pick?.hero_name ?? "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {game.notes && (
                  <p className="text-sm text-white/70 whitespace-pre-line">{game.notes}</p>
                )}

                {/* Screenshot */}
                {game.signedUrl && (
                  <a
                    href={game.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={game.signedUrl}
                      alt={`Screenshot Game ${game.game_number}`}
                      className="rounded-lg border border-white/10 w-full max-h-[300px] object-contain"
                    />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coach notes */}
      {result?.coach_notes && (
        <div className="mx-auto max-w-2xl w-full rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 shadow-xl shadow-black/20">
          <h3 className="text-sm font-semibold text-white mb-2">Catatan Coach</h3>
          <p className="text-sm text-white/80 whitespace-pre-line">{result.coach_notes}</p>
        </div>
      )}

      {gamesWithUrls.length === 0 && (
        <p className="text-sm text-white/40 mx-auto max-w-2xl">Belum ada detail per-game.</p>
      )}
    </div>
  );
}
