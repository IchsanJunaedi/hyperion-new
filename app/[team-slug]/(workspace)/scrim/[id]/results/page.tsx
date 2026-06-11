import { ArrowLeft, Swords, Shield } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import { getScrimDetail } from "@/features/scrim/queries";
import { VodReviewSection } from "@/features/scrim/components/VodReviewSection";
import type { VodTimestampRow } from "@/features/scrim/actions/vodTimestampsAction";
import { getScrimAiReviews } from "@/features/scrim/queries/aiReviews";
import { AiTacticalReviewCard } from "@/features/scrim/components/AiTacticalReviewCard";

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: gameResults },
    { data: draftPicks },
    { data: draftBans },
    { data: vodTimestamps },
    { data: attendances },
    memberRes,
  ] = await Promise.all([
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
    admin
      .from("scrim_draft_bans")
      .select("*")
      .eq("scrim_id", id)
      .order("game_number", { ascending: true })
      .order("ban_order", { ascending: true }),
    admin
      .from("scrim_vod_timestamps" as never)
      .select("*")
      .eq("scrim_id", id)
      .order("timestamp_secs", { ascending: true }),
    admin
      .from("scrim_attendances")
      .select("user_id")
      .eq("scrim_id", id)
      .in("status", ["confirmed", "tentative"]),
    user
      ? admin
          .from("team_members")
          .select("role")
          .eq("organization_id", scrim.organization_id)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const userRole = (memberRes as { data: { role: string } | null }).data?.role ?? null;
  const isOwner = user?.email === process.env.OWNER_EMAIL;
  const canEdit = isOwner || ["manager", "coach", "captain"].includes(userRole ?? "");
  const isCoach = isOwner || userRole === "manager" || userRole === "coach";
  const currentUserId = user?.id ?? "";

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

  const aiReviews = await getScrimAiReviews(id);
  const reviewByGame = new Map(aiReviews.map((r) => [r.game_number, r.narrative]));

  // Collect all user_ids we need profiles for: draft picks + attendances
  const draftPlayerIds = (draftPicks ?? [])
    .filter((p) => p.side === "our" && p.player_id)
    .map((p) => p.player_id as string);
  const attendanceUserIds = (attendances ?? []).map((a) => a.user_id);
  const allUserIds = Array.from(new Set([...draftPlayerIds, ...attendanceUserIds]));

  const playerProfileMap = new Map<string, string>();
  if (allUserIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", allUserIds);
    for (const p of profiles ?? []) {
      if (p.display_name) playerProfileMap.set(p.id, p.display_name);
    }
  }

  // Build attending players list for VOD dropdown (from scrim_attendances)
  const attendingPlayers = (attendances ?? [])
    .map((a) => ({ userId: a.user_id, displayName: playerProfileMap.get(a.user_id) ?? a.user_id }))
    .filter((p) => p.displayName)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

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

  // Group draft bans by game_number → side
  const bansByGame: Record<number, { our: string[]; enemy: string[] }> = {};
  for (const ban of draftBans ?? []) {
    let gameBans = bansByGame[ban.game_number];
    if (!gameBans) {
      gameBans = { our: [], enemy: [] };
      bansByGame[ban.game_number] = gameBans;
    }
    if (ban.side === "our") {
      gameBans.our.push(ban.hero_name);
    } else {
      gameBans.enemy.push(ban.hero_name);
    }
  }

  // Group VOD timestamps by game_number, attach player name
  const vodByGame: Record<number, VodTimestampRow[]> = {};
  for (const ts of (vodTimestamps ?? []) as Record<string, unknown>[]) {
    const gn = ts.game_number as number;
    if (!vodByGame[gn]) vodByGame[gn] = [];
    vodByGame[gn].push({
      id: ts.id as string,
      scrim_id: ts.scrim_id as string,
      game_number: gn,
      timestamp_secs: ts.timestamp_secs as number,
      tagged_player_id: ts.tagged_player_id as string | null,
      note: ts.note as string,
      created_by: ts.created_by as string,
      created_at: ts.created_at as string,
      tagged_player_name: ts.tagged_player_id
        ? (playerProfileMap.get(ts.tagged_player_id as string) ?? null)
        : null,
    });
  }


  const wins = gamesWithUrls.filter((g) => g.is_win).length;
  const losses = gamesWithUrls.filter((g) => !g.is_win).length;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      {/* Back */}
      <div className="flex justify-start">
        <Link
          href={`/${slug}/scrim/${id}`}
          className="group inline-flex items-center gap-2 rounded-full border border-ui-border bg-ui-surface/40 px-3.5 py-1.5 text-xs font-semibold text-ui-text-2 transition-all duration-300 hover:bg-ui-elevated/60 hover:text-ui-text"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke detail scrim
        </Link>
      </div>

      {/* Header */}
      <div className="mx-auto max-w-2xl w-full space-y-2">
        <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight">
          Hasil Pertandingan
        </h1>
        <p className="text-sm text-ui-text-2">
          vs {scrim.opponent_name} · {scrim.format.toUpperCase()}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-3xl font-bold text-ui-text">{wins}</span>
          <span className="text-xl text-ui-text-muted">—</span>
          <span className="text-3xl font-bold text-ui-text">{losses}</span>
          <span className={`ml-3 text-sm font-semibold uppercase tracking-wide ${
            wins > losses ? "text-green-400" : wins < losses ? "text-red-400" : "text-ui-text-muted"
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
          const gameBans = bansByGame[game.game_number];
          const ourBans = gameBans?.our ?? [];
          const enemyBans = gameBans?.enemy ?? [];
          const hasDraft = ourPicks.length > 0 || enemyPicks.length > 0 || ourBans.length > 0 || enemyBans.length > 0;
          const gameTimestamps = vodByGame[game.game_number] ?? [];

          return (
            <div
              key={game.id}
              className="rounded-xl border border-ui-border bg-ui-surface/40 overflow-hidden"
            >
              {/* Game header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-ui-border">
                <h3 className="text-sm font-semibold text-ui-text">Game {game.game_number}</h3>
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
                      {/* Banned heroes */}
                      {ourBans.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mb-2 bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.04]">
                          <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider mr-1">BAN:</span>
                          {ourBans.map((ban, idx) => (
                            <div key={idx} className="relative h-6 w-6 overflow-hidden rounded-full border border-red-500/30 bg-zinc-800" title={ban}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={getHeroImageUrl(ban)} alt={ban} className="h-full w-full object-cover grayscale opacity-85" />
                              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/60 -rotate-45 transform origin-center" />
                            </div>
                          ))}
                        </div>
                      )}
                      {ROLE_ORDER.map((role) => {
                        const pick = ourPicks.find((p) => p.role === role);
                        const displayName = pick?.player_id
                          ? playerProfileMap.get(pick.player_id)
                          : undefined;
                        return (
                          <div key={role} className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ui-text-muted w-9 shrink-0">
                              {ROLE_LABELS[role] ?? role}
                            </span>
                            {pick ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-ui-border bg-ui-elevated">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={getHeroImageUrl(pick.hero_name)}
                                    alt={pick.hero_name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-medium text-ui-text truncate block">
                                    {pick.hero_name}
                                  </span>
                                  {displayName && (
                                    <span className="text-[10px] text-ui-text-muted truncate block">
                                      {displayName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-ui-text-muted">—</span>
                            )}
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
                      {/* Banned heroes */}
                      {enemyBans.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mb-2 bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.04]">
                          <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider mr-1">BAN:</span>
                          {enemyBans.map((ban, idx) => (
                            <div key={idx} className="relative h-6 w-6 overflow-hidden rounded-full border border-red-500/30 bg-zinc-800" title={ban}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={getHeroImageUrl(ban)} alt={ban} className="h-full w-full object-cover grayscale opacity-85" />
                              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/60 -rotate-45 transform origin-center" />
                            </div>
                          ))}
                        </div>
                      )}
                      {ROLE_ORDER.map((role) => {
                        const pick = enemyPicks.find((p) => p.role === role);
                        return (
                          <div key={role} className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ui-text-muted w-9 shrink-0">
                              {ROLE_LABELS[role] ?? role}
                            </span>
                            {pick ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-ui-border bg-ui-elevated">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={getHeroImageUrl(pick.hero_name)}
                                    alt={pick.hero_name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <span className="text-xs font-medium text-ui-text truncate">
                                  {pick.hero_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-ui-text-muted">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {game.notes && (
                  <p className="text-sm text-ui-text whitespace-pre-line">{game.notes}</p>
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
                      className="rounded-lg border border-ui-border w-full max-h-[300px] object-contain"
                    />
                  </a>
                )}

                {/* AI Tactical Review */}
                {(() => {
                  const narrative = reviewByGame.get(game.game_number);
                  return narrative ? <AiTacticalReviewCard narrative={narrative} /> : null;
                })()}
              </div>

              {/* VOD Review accordion */}
              <VodReviewSection
                scrimId={id}
                gameNumber={game.game_number}
                initialTimestamps={gameTimestamps}
                players={attendingPlayers}
                canEdit={canEdit}
                currentUserId={currentUserId}
                isCoach={isCoach}
              />
            </div>
          );
        })}
      </div>

      {/* Coach notes */}
      {result?.coach_notes && (
        <div className="mx-auto max-w-2xl w-full rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 shadow-xl shadow-black/20">
          <h3 className="text-sm font-semibold text-ui-text mb-2">Catatan Coach</h3>
          <p className="text-sm text-ui-text whitespace-pre-line">{result.coach_notes}</p>
        </div>
      )}

      {gamesWithUrls.length === 0 && (
        <p className="text-sm text-ui-text-muted mx-auto max-w-2xl">Belum ada detail per-game.</p>
      )}
    </div>
  );
}
