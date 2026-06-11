"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CheckCircle, ChevronDown, ChevronUp, ClipboardList, Loader2, Plus, Star,
  Trophy, Upload, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { NumberInput } from "@/components/ui/number-input";
import { finishScrimAction } from "../actions/finishScrimAction";
import { createClient } from "@/lib/supabase/client";
import {
  DraftSection,
  makeBlankDraft,
  type AttendingPlayer,
  type DraftPicks,
} from "./DraftSection";
import { ROLE_LABELS, ROLES } from "@/features/scrim/data/mlbb-heroes";
import type { RoleName } from "@/features/scrim/data/mlbb-heroes";
import { cn } from "@/lib/utils/cn";
import { ScreenshotDropzone } from "./ScreenshotDropzone";
import type { AnalyzedPayload } from "./ScreenshotDropzone";
import type { DraftResult, ScoreboardResult } from "@/features/scrim/ai/screenshot-schema";
import { generateTacticalReviewAction } from "../actions/tacticalReviewAction";

// ─── BO format logic ──────────────────────────────────────────────────────────

type FormatConfig = {
  minGames: number;
  maxGames: number;
  winsNeeded: number | null;
  fixedGames: boolean;
};

const FORMAT_CONFIG: Record<string, FormatConfig> = {
  bo1:      { minGames: 1, maxGames: 1, winsNeeded: 1,    fixedGames: true  },
  bo2:      { minGames: 2, maxGames: 2, winsNeeded: null,  fixedGames: true  },
  bo3:      { minGames: 2, maxGames: 3, winsNeeded: 2,    fixedGames: false },
  bo5:      { minGames: 3, maxGames: 5, winsNeeded: 3,    fixedGames: false },
  bo7:      { minGames: 4, maxGames: 7, winsNeeded: 4,    fixedGames: false },
  "4match": { minGames: 4, maxGames: 4, winsNeeded: null,  fixedGames: true  },
  scrimmage:{ minGames: 1, maxGames: 1, winsNeeded: 1,    fixedGames: true  },
};
const DEFAULT_CONFIG: FormatConfig = { minGames: 1, maxGames: 1, winsNeeded: 1, fixedGames: true };

function getConfig(fmt: string): FormatConfig {
  return FORMAT_CONFIG[fmt.toLowerCase()] ?? DEFAULT_CONFIG;
}

function isSeriesOver(games: GameResult[], cfg: FormatConfig): boolean {
  if (cfg.fixedGames || cfg.winsNeeded === null) return false;
  const w = games.filter((g) => g.isWin === true).length;
  const l = games.filter((g) => g.isWin === false).length;
  return w >= cfg.winsNeeded || l >= cfg.winsNeeded;
}

// ─── State types ──────────────────────────────────────────────────────────────

interface GameResult {
  isWin: boolean | null;
  notes: string;
  imageUrl: string | null;
  uploading: boolean;
  draft: DraftPicks;
  scoreboard: ScoreboardResult | null; // AI-scanned, editable, persisted to scrim_ai_reviews
}

interface PlayerEval {
  rating: string;   // string for controlled input
  coachNotes: string;
}

function makeBlankGame(): GameResult {
  return { isWin: null, notes: "", imageUrl: null, uploading: false, draft: makeBlankDraft(), scoreboard: null };
}

function extractDraftResult(draft: DraftPicks): DraftResult | null {
  const our = {} as DraftResult["picks"]["our"];
  const enemy = {} as DraftResult["picks"]["enemy"];
  let hasAny = false;
  for (const role of ROLES) {
    our[role] = draft.our[role].hero;
    enemy[role] = draft.enemy[role];
    if (draft.our[role].hero || draft.enemy[role]) hasAny = true;
  }
  const bansOur = draft.bans?.our ?? [];
  const bansEnemy = draft.bans?.enemy ?? [];
  if (bansOur.some(Boolean) || bansEnemy.some(Boolean)) hasAny = true;
  if (!hasAny) return null;
  return { bans: { our: bansOur, enemy: bansEnemy }, picks: { our, enemy } };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FinishScrimFormProps {
  scrimId: string;
  orgSlug: string;
  orgId: string;
  format: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const FinishScrimForm = ({
  scrimId,
  orgSlug,
  orgId,
  format,
}: FinishScrimFormProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coachNotes, setCoachNotes] = useState("");

  const config = getConfig(format);
  const [games, setGames] = useState<GameResult[]>(
    Array.from({ length: config.minGames }, makeBlankGame),
  );
  const [activeGame, setActiveGame] = useState(0);
  const [showScoreboardReview, setShowScoreboardReview] = useState(false);

  // Attending players (fetched on mount)
  const [attendingPlayers, setAttendingPlayers] = useState<AttendingPlayer[]>([]);
  const [playerEvals, setPlayerEvals] = useState<Map<string, PlayerEval>>(new Map());

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: att } = await supabase
        .from("scrim_attendances")
        .select("user_id")
        .eq("scrim_id", scrimId)
        .eq("status", "confirmed");

      const userIds = (att ?? []).map((a) => a.user_id);
      if (userIds.length === 0) return;

      const [profilesRes, membersRes] = await Promise.all([
        supabase.from("profiles").select("id, display_name").in("id", userIds),
        supabase
          .from("team_members")
          .select("user_id, main_role")
          .eq("organization_id", orgId)
          .in("user_id", userIds)
          .in("role", ["captain", "member"]),
      ]);

      const profileMap = new Map(
        (profilesRes.data ?? []).map((p) => [p.id, p.display_name]),
      );
      const memberMap = new Map(
        (membersRes.data ?? []).map((m) => [m.user_id, m.main_role]),
      );

      const players: AttendingPlayer[] = userIds.map((uid) => ({
        userId: uid,
        displayName: profileMap.get(uid) ?? null,
        mainRole: memberMap.get(uid) ?? null,
      }));

      setAttendingPlayers(players);
      setPlayerEvals(
        new Map(players.map((p) => [p.userId, { rating: "", coachNotes: "" }])),
      );
    }
    load();
  }, [scrimId, orgId]);

  // ── Game helpers ─────────────────────────────────────────────────────────

  const seriesOver = isSeriesOver(games, config);
  const canAddMore = !config.fixedGames && games.length < config.maxGames && !seriesOver;

  function updateGame(i: number, patch: Partial<GameResult>) {
    setGames((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }

  function updateOurDraft(i: number, role: RoleName, hero: string, playerId: string | null) {
    setGames((prev) =>
      prev.map((g, idx) =>
        idx === i
          ? {
              ...g,
              draft: {
                ...g.draft,
                our: { ...g.draft.our, [role]: { hero, playerId } },
              },
            }
          : g,
      ),
    );
  }

  function updateEnemyDraft(i: number, role: RoleName, hero: string) {
    setGames((prev) =>
      prev.map((g, idx) =>
        idx === i
          ? { ...g, draft: { ...g.draft, enemy: { ...g.draft.enemy, [role]: hero } } }
          : g,
      ),
    );
  }

  function updateBan(gameIndex: number, side: "our" | "enemy", banIndex: number, hero: string) {
    setGames((prev) =>
      prev.map((g, idx) => {
        if (idx !== gameIndex) return g;
        const newSideBans = [...g.draft.bans[side]];
        newSideBans[banIndex] = hero;
        return { ...g, draft: { ...g.draft, bans: { ...g.draft.bans, [side]: newSideBans } } };
      }),
    );
  }

  // ── AI autofill handlers ─────────────────────────────────────────────────

  function applyDraftScan(i: number, d: DraftResult) {
    setGames((prev) => prev.map((g, idx) => {
      if (idx !== i) return g;
      return {
        ...g,
        draft: {
          ...g.draft,
          bans: {
            our: d.bans.our.length ? d.bans.our : g.draft.bans.our,
            enemy: d.bans.enemy.length ? d.bans.enemy : g.draft.bans.enemy,
          },
        },
      };
    }));
  }

  function applyScoreboardScan(i: number, s: ScoreboardResult) {
    setGames((prev) => prev.map((g, idx) => {
      if (idx !== i) return g;

      const our = { ...g.draft.our };
      const enemy = { ...g.draft.enemy };

      // Fill our picks from scoreboard
      (s.players ?? []).forEach((p) => {
        const role = p.role;
        if (role && ROLES.includes(role)) {
          // Find matching attending player by display name (case-insensitive)
          const matchedPlayer = attendingPlayers.find(
            (ap) => ap.displayName?.toLowerCase().trim() === p.displayName?.toLowerCase().trim()
          );
          our[role] = {
            hero: p.heroName,
            playerId: matchedPlayer ? matchedPlayer.userId : (g.draft.our[role].playerId || null),
          };
        }
      });

      // Fill enemy picks from scoreboard
      (s.enemyPlayers ?? []).forEach((p) => {
        const role = p.role;
        if (role && ROLES.includes(role)) {
          enemy[role] = p.heroName;
        }
      });

      return {
        ...g,
        isWin: s.isWin,
        scoreboard: s,
        draft: {
          ...g.draft,
          our,
          enemy,
        },
      };
    }));
  }

  function handleAnalyzed(i: number, payload: AnalyzedPayload) {
    if (payload.kind === "draft") applyDraftScan(i, payload.data);
    else {
      applyScoreboardScan(i, payload.data);
      setShowScoreboardReview(true);
    }
  }

  function updateScoreboardPlayer(i: number, pIdx: number, patch: Partial<ScoreboardResult["players"][number]>) {
    setGames((prev) => prev.map((g, idx) => {
      if (idx !== i || !g.scoreboard) return g;
      const players = g.scoreboard.players.map((pl, j) => (j === pIdx ? { ...pl, ...patch } : pl));
      return { ...g, scoreboard: { ...g.scoreboard, players } };
    }));
  }

  function addGame() {
    if (!canAddMore) return;
    const next = games.length;
    setGames((prev) => [...prev, makeBlankGame()]);
    setActiveGame(next);
  }

  function removeLastGame() {
    if (games.length <= config.minGames) return;
    setGames((prev) => prev.slice(0, -1));
    setActiveGame((prev) => Math.min(prev, games.length - 2));
  }

  // ── Image upload ─────────────────────────────────────────────────────────

  async function handleImageUpload(i: number, file: File) {
    if (file.size > 10 * 1024 * 1024) { setError("Gambar maksimal 10MB"); return; }
    updateGame(i, { uploading: true });
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${orgId}/scrim-results/${scrimId}/game-${i + 1}-${Date.now()}.${ext}`;
    const { error: err } = await supabase.storage
      .from("org-private")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (err) { setError(err.message); updateGame(i, { uploading: false }); return; }
    updateGame(i, { imageUrl: path, uploading: false });
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (games.some((g) => g.isWin === null)) {
      setError("Pilih Menang atau Kalah untuk semua game");
      return;
    }
    startTransition(async () => {
      setError(null);
      const res = await finishScrimAction({
        scrimId,
        orgSlug,
        games: games.map((g, i) => ({
          gameNumber: i + 1,
          isWin: g.isWin!,
          notes: g.notes || null,
          imageUrl: g.imageUrl,
          bans: {
            our: g.draft.bans?.our ?? [],
            enemy: g.draft.bans?.enemy ?? [],
          },
          draftPicks: [
            ...Object.entries(g.draft.our)
              .filter(([, slot]) => slot.hero)
              .map(([role, slot]) => ({
                side: "our" as const,
                role,
                hero_name: slot.hero,
                player_id: slot.playerId,
              })),
            ...Object.entries(g.draft.enemy)
              .filter(([, hero]) => hero)
              .map(([role, hero]) => ({
                side: "enemy" as const,
                role,
                hero_name: hero,
                player_id: null,
              })),
          ],
        })),
        coachNotes: coachNotes || null,
        playerEvals: Array.from(playerEvals.entries()).map(([userId, ev]) => ({
          userId,
          rating: ev.rating === "" ? null : parseFloat(ev.rating),
          coachNotes: ev.coachNotes || null,
        })),
      });
      if (res.ok) {
        // Best-effort AI tactical review (non-blocking on failure)
        const reviewGames = games
          .map((g, i) => ({
            gameNumber: i + 1,
            isWin: g.isWin === true,
            draft: extractDraftResult(g.draft),
            scoreboard: g.scoreboard,
          }))
          .filter((g) => g.draft || g.scoreboard);
        if (reviewGames.length > 0) {
          const aiRes = await generateTacticalReviewAction({ scrimId, orgId, orgSlug, games: reviewGames });
          if (!aiRes.ok) toast.message(aiRes.message ?? "Review AI dilewati");
        }
        toast.success("Hasil scrim disimpan!");
        router.push(`/${orgSlug}/analytics`);
      } else {
        setError(res.message ?? "Gagal menyimpan hasil");
      }
    });
  }

  const wins = games.filter((g) => g.isWin === true).length;
  const losses = games.filter((g) => g.isWin === false).length;
  const game = games[activeGame]!;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      {/* ── Header greeting ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-ui-border bg-ui-surface/40 px-5 py-4 shadow-xl shadow-black/20">
        <p className="text-xs font-medium text-yellow-400/80">Assalamu&apos;alaikum, Coach</p>
        <div className="mt-2 flex items-center gap-3">
          <Trophy className="h-5 w-5 shrink-0 text-yellow-400" />
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-emerald-400">{wins}W</span>
            <span className="text-ui-text-muted">—</span>
            <span className="font-bold text-red-400">{losses}L</span>
            <span className="text-ui-text-muted">·</span>
            <span className="font-medium text-ui-text-2">{format.toUpperCase()}</span>
            <span className="text-ui-text-muted">·</span>
            <span className="text-xs text-ui-text-muted">{games.length} game</span>
          </div>
          {seriesOver && (
            <span className="ml-auto rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-xs font-semibold text-yellow-400">
              Series Selesai
            </span>
          )}
        </div>
      </div>

      {/* ── Game tabs ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-ui-border pb-0">
        {games.map((g, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveGame(i)}
            className={cn(
              "relative pb-2.5 px-3 text-xs font-medium transition-colors",
              activeGame === i
                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-yellow-400 after:content-['']"
                : "text-ui-text-muted hover:text-ui-text",
            )}
          >
            Game {i + 1}
            {g.isWin === true && (
              <span className="ml-1 text-[9px] text-emerald-400">W</span>
            )}
            {g.isWin === false && (
              <span className="ml-1 text-[9px] text-red-400">L</span>
            )}
          </button>
        ))}
        {canAddMore && (
          <button
            type="button"
            onClick={addGame}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded text-ui-text-muted hover:bg-ui-elevated hover:text-ui-text transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
        {games.length > config.minGames && (
          <button
            type="button"
            onClick={removeLastGame}
            className="ml-auto text-[10px] text-ui-text-muted hover:text-rose-400 transition-colors"
          >
            Hapus Game {games.length}
          </button>
        )}
      </div>

      {/* ── Active game card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5 shadow-xl shadow-black/20 space-y-4">
        {/* Win / Loss */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateGame(activeGame, { isWin: game.isWin === true ? null : true })}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-all",
              game.isWin === true
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                : "border border-ui-border bg-ui-elevated text-ui-text-2 hover:bg-ui-hover",
            )}
          >
            <CheckCircle className="h-4 w-4" />
            Menang
          </button>
          <button
            type="button"
            onClick={() => updateGame(activeGame, { isWin: game.isWin === false ? null : false })}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-all",
              game.isWin === false
                ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                : "border border-ui-border bg-ui-elevated text-ui-text-2 hover:bg-ui-hover",
            )}
          >
            <XCircle className="h-4 w-4" />
            Kalah
          </button>
        </div>

        {/* AI auto-fill */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ScreenshotDropzone
            kind="draft"
            label="Upload Screenshot Draft"
            orgId={orgId}
            scrimId={scrimId}
            gameIndex={activeGame}
            onAnalyzed={(p) => handleAnalyzed(activeGame, p)}
          />
          <ScreenshotDropzone
            kind="scoreboard"
            label="Upload Screenshot Scoreboard"
            orgId={orgId}
            scrimId={scrimId}
            gameIndex={activeGame}
            onAnalyzed={(p) => handleAnalyzed(activeGame, p)}
          />
        </div>

        {/* Draft */}
        <DraftSection
          draft={game.draft}
          attendingPlayers={attendingPlayers}
          onOurChange={(role, hero, playerId) => updateOurDraft(activeGame, role, hero, playerId)}
          onEnemyChange={(role, hero) => updateEnemyDraft(activeGame, role, hero)}
          onBanChange={(side, index, hero) => updateBan(activeGame, side, index, hero)}
        />

        {/* Scoreboard scan review */}
        {game.scoreboard && game.scoreboard.players.length > 0 && (
          <div className="rounded-xl border border-ui-border bg-ui-surface p-3 space-y-2">
            <button
              type="button"
              onClick={() => setShowScoreboardReview((v) => !v)}
              className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted hover:text-ui-text transition-colors cursor-pointer"
            >
              <span>Hasil Scan Scoreboard — periksa &amp; koreksi</span>
              {showScoreboardReview ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showScoreboardReview && (
              <div className="space-y-2 pt-2 border-t border-ui-border">
                {game.scoreboard.players.map((pl, pIdx) => (
                  <div key={pIdx} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                    <input
                      value={pl.heroName}
                      onChange={(e) => updateScoreboardPlayer(activeGame, pIdx, { heroName: e.target.value })}
                      className="h-7 rounded border border-ui-border bg-ui-bg px-2 text-xs text-ui-text w-full min-w-0"
                    />
                    {(["kills", "deaths", "assists"] as const).map((stat) => (
                      <div key={stat} className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase text-ui-text-muted w-3 text-center">
                          {stat === "kills" ? "K" : stat === "deaths" ? "D" : "A"}
                        </span>
                        <NumberInput
                          min={0}
                          hideSteppers
                          value={String(pl[stat])}
                          onChange={(e) => updateScoreboardPlayer(activeGame, pIdx, { [stat]: parseInt(e.target.value || "0", 10) })}
                          className="h-7 w-12 text-center text-xs text-ui-text bg-ui-bg border-ui-border pr-2 pl-2"
                          containerClassName="w-12"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Game notes */}
        <div>
          <p className="mb-1 text-[10px] font-medium text-ui-text-muted">Catatan Game {activeGame + 1}</p>
          <textarea
            value={game.notes}
            onChange={(e) => updateGame(activeGame, { notes: e.target.value })}
            rows={2}
            maxLength={1000}
            placeholder="Strategi, kesalahan, highlight…"
            className="w-full resize-none rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text placeholder:text-ui-text-muted focus:border-yellow-400 focus:outline-none"
          />
        </div>

        {/* Screenshot */}
        <div className="flex items-center gap-3">
          <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-ui-border px-3 text-xs text-ui-text-2 transition-colors hover:bg-ui-elevated">
            {game.uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Upload screenshot
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={game.uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(activeGame, f);
              }}
            />
          </label>
          {game.imageUrl && (
            <span className="text-xs font-medium text-emerald-400">✓ Uploaded</span>
          )}
        </div>
      </div>

      {/* ── Performance Evaluation ───────────────────────────────────────── */}
      {attendingPlayers.length > 0 && (
        <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 shadow-xl shadow-black/20 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ui-text">
            <Star className="h-4 w-4 text-yellow-400" />
            Evaluasi Pemain
            <span className="text-xs font-normal text-ui-text-muted">— per scrim</span>
          </h3>
          <div className="space-y-3">
            {attendingPlayers.map((p) => {
              const ev = playerEvals.get(p.userId) ?? { rating: "", coachNotes: "" };
              return (
                <div key={p.userId} className="rounded-xl border border-ui-border bg-ui-surface/60 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ui-text">
                        {p.displayName ?? "Unknown"}
                      </p>
                      {p.mainRole && (
                        <p className="text-[10px] text-ui-text-muted">
                          {ROLE_LABELS[p.mainRole as RoleName] ?? p.mainRole}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="text-[10px] text-ui-text-muted">Rating</span>
                      <NumberInput
                        min={0}
                        max={10}
                        step={0.1}
                        value={ev.rating}
                        onChange={(e) =>
                          setPlayerEvals((prev) => {
                            const next = new Map(prev);
                            next.set(p.userId, { ...ev, rating: e.target.value });
                            return next;
                          })
                        }
                        placeholder="0–10"
                        className="h-7 text-center text-xs text-ui-text bg-ui-surface border-ui-border focus:border-yellow-400 focus:outline-none"
                        containerClassName="w-20 shrink-0"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={ev.coachNotes}
                    onChange={(e) =>
                      setPlayerEvals((prev) => {
                        const next = new Map(prev);
                        next.set(p.userId, { ...ev, coachNotes: e.target.value });
                        return next;
                      })
                    }
                    placeholder="Catatan untuk pemain ini…"
                    maxLength={500}
                    className="w-full rounded-lg border border-ui-border bg-ui-surface px-2.5 py-1.5 text-xs text-ui-text placeholder:text-ui-text-muted focus:border-blue-400 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Overall coach notes ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5 shadow-xl shadow-black/20 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ui-text">
          <ClipboardList className="h-4 w-4 text-ui-text-2" />
          Catatan Coach
          <span className="text-xs font-normal text-ui-text-muted">— keseluruhan scrim</span>
        </h3>
        <textarea
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          rows={4}
          maxLength={3000}
          placeholder="Analisis keseluruhan, taktik, catatan penting…"
          className="w-full resize-none rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text placeholder:text-ui-text-muted focus:border-blue-400 focus:outline-none"
        />
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <button
        type="button"
        disabled={pending}
        onClick={handleSubmit}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-yellow-400 px-6 text-sm font-semibold text-black shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
        Simpan Hasil & Selesaikan Scrim
      </button>
    </div>
  );
};
export { FinishScrimForm };
