"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ROLES, ROLE_LABELS, type RoleName } from "@/features/scrim/data/mlbb-heroes";
import { makeBlankDraft, DraftSection, type DraftPicks, type AttendingPlayer } from "@/features/scrim/components/DraftSection";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import {
  addTournamentGameResultAction,
  updateTournamentGameResultAction,
  deleteTournamentGameResultAction,
  saveTournamentDraftPicksAction,
} from "@/features/tournaments/actions";
import type { TournamentGameResult, TournamentDraftPick } from "@/features/tournaments/queries";
import { toast } from "sonner";

interface TournamentMatchDetailProps {
  matchId: string;
  tournamentId: string;
  orgSlug: string;
  matchFormat: string | null; // BO1/BO3/BO5/BO7
  gameResults: TournamentGameResult[];
  canManage: boolean;
  attendingPlayers: AttendingPlayer[];
}

// ─── Draft picks helper ───────────────────────────────────────────────────────

function draftFromPicks(picks: TournamentDraftPick[]): DraftPicks {
  const state = makeBlankDraft();
  for (const p of picks) {
    if (p.pick_type === "pick") {
      if (p.side === "our" && p.role && p.role in state.our) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state.our[p.role as RoleName] = { hero: p.hero_name, playerId: (p as any).player_id ?? null };
      } else if (p.side === "opponent" && p.role && p.role in state.enemy) {
        state.enemy[p.role as RoleName] = p.hero_name;
      }
    } else if (p.pick_type === "ban") {
      if (p.side === "our") {
        const i = parseInt(p.role ?? "0", 10);
        if (i >= 0 && i < 5) state.bans.our[i] = p.hero_name;
      } else {
        const i = parseInt(p.role ?? "0", 10);
        if (i >= 0 && i < 5) state.bans.enemy[i] = p.hero_name;
      }
    }
  }
  return state;
}

function draftToPicks(
  draft: DraftPicks,
): Array<{ hero_name: string; side: "our" | "opponent"; pick_type: "pick" | "ban"; role: string | null; playerId?: string | null }> {
  const picks: Array<{
    hero_name: string;
    side: "our" | "opponent";
    pick_type: "pick" | "ban";
    role: string | null;
    playerId?: string | null;
  }> = [];
  for (const role of ROLES) {
    const ourSlot = draft.our[role];
    if (ourSlot.hero) picks.push({ hero_name: ourSlot.hero, side: "our", pick_type: "pick", role, playerId: ourSlot.playerId });
    if (draft.enemy[role]) picks.push({ hero_name: draft.enemy[role], side: "opponent", pick_type: "pick", role });
  }
  draft.bans.our.forEach((hero, i) => {
    if (hero) picks.push({ hero_name: hero, side: "our", pick_type: "ban", role: String(i) });
  });
  draft.bans.enemy.forEach((hero, i) => {
    if (hero) picks.push({ hero_name: hero, side: "opponent", pick_type: "ban", role: String(i) });
  });
  return picks;
}

// ─── TournamentMatchDetail ─────────────────────────────────────────────────────

const TournamentMatchDetail = ({
  matchId,
  tournamentId,
  orgSlug,
  matchFormat,
  gameResults,
  canManage,
  attendingPlayers,
}: TournamentMatchDetailProps) => {
  const maxGames = matchFormat
    ? parseInt(matchFormat.replace(/[^0-9]/g, ""), 10) || 1
    : 1;

  const existingGamesMap = new Map(gameResults.map((g) => [g.game_number, g]));
  const gameNumbers = Array.from({ length: maxGames }, (_, i) => i + 1);

  return (
    <div className="mt-2 space-y-3 pl-2 border-l-2 border-ui-border ml-2">
      {gameNumbers.map((gameNum) => {
        const existing = existingGamesMap.get(gameNum);
        
        // Hide uncreated games for non-managers
        if (!canManage && !existing) return null;

        return (
          <GameResultBlock
            key={existing ? existing.id : `new-${gameNum}`}
            gameNumber={gameNum}
            gameResult={existing}
            matchId={matchId}
            tournamentId={tournamentId}
            orgSlug={orgSlug}
            canManage={canManage}
            attendingPlayers={attendingPlayers}
          />
        );
      })}
      
      {!canManage && gameResults.length === 0 && (
        <p className="text-[11px] text-ui-text-muted italic">Belum ada hasil pertandingan.</p>
      )}
    </div>
  );
};
export { TournamentMatchDetail };

// ─── GameResultBlock ────────────────────────────────────────────────────────────

function GameResultBlock({
  gameNumber,
  gameResult,
  matchId,
  tournamentId,
  orgSlug,
  canManage,
  attendingPlayers,
}: {
  gameNumber: number;
  gameResult?: TournamentGameResult;
  matchId: string;
  tournamentId: string;
  orgSlug: string;
  canManage: boolean;
  attendingPlayers: AttendingPlayer[];
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  // Result edit state
  const [isWin, setIsWin] = useState<string>(
    gameResult?.is_win === true ? "win" : gameResult?.is_win === false ? "lose" : "",
  );
  const [notes, setNotes] = useState(gameResult?.notes ?? "");

  // Draft state
  const [draft, setDraft] = useState<DraftPicks>(() => draftFromPicks(gameResult?.draft_picks ?? []));

  const handleOurChange = (role: RoleName, hero: string, playerId: string | null) => {
    setDraft((prev) => ({
      ...prev,
      our: { ...prev.our, [role]: { hero, playerId } },
    }));
  };

  const handleEnemyChange = (role: RoleName, hero: string) => {
    setDraft((prev) => ({
      ...prev,
      enemy: { ...prev.enemy, [role]: hero },
    }));
  };

  const handleBanChange = (side: "our" | "enemy", index: number, hero: string) => {
    setDraft((prev) => {
      const nextBans = { ...prev.bans };
      const sideBans = [...nextBans[side]];
      sideBans[index] = hero;
      nextBans[side] = sideBans;
      return { ...prev, bans: nextBans };
    });
  };

  function handleSave() {
    if (isWin === "") {
      toast.error("Pilih Hasil (Menang/Kalah) terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      let targetResultId = gameResult?.id;

      // 1. Create or Update Game Result
      if (!targetResultId) {
        const res = await addTournamentGameResultAction(orgSlug, tournamentId, matchId, {
          game_number: gameNumber,
          is_win: isWin === "win" ? true : false,
          notes: notes || undefined,
        });
        if (!res.ok) {
          toast.error(res.message);
          return;
        }
        targetResultId = (res as { id: string }).id;
      } else {
        const res = await updateTournamentGameResultAction(orgSlug, tournamentId, targetResultId, {
          is_win: isWin === "win" ? true : false,
          notes: notes || undefined,
        });
        if (!res.ok) {
          toast.error(res.message);
          return;
        }
      }

      // 2. Save Draft Picks
      const picks = draftToPicks(draft);
      const draftRes = await saveTournamentDraftPicksAction(orgSlug, tournamentId, targetResultId, picks);
      if (draftRes.ok) {
        toast.success(`Game ${gameNumber} berhasil disimpan!`);
      } else {
        toast.error(draftRes.message);
      }
    });
  }

  function handleDelete() {
    if (!gameResult) return;
    startTransition(async () => {
      const res = await deleteTournamentGameResultAction(orgSlug, tournamentId, gameResult.id);
      if (res.ok) {
        toast.success(`Game ${gameNumber} dihapus!`);
        setShowDeleteConfirm(false);
      } else {
        toast.error(res.message);
      }
    });
  }

  if (!canManage) {
    if (!gameResult) return null;
    return (
      <div className="rounded-lg border border-ui-border bg-ui-surface p-3 space-y-3">
        <div className="flex items-center gap-2 border-b border-ui-border pb-2">
          <span className="text-xs font-bold text-ui-text">Game {gameNumber}</span>
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              gameResult.is_win === true
                ? "bg-green-500/10 text-green-400"
                : gameResult.is_win === false
                  ? "bg-red-500/10 text-red-400"
                  : "bg-zinc-800 text-ui-text-muted",
            )}
          >
            {gameResult.is_win === true ? "MENANG" : gameResult.is_win === false ? "KALAH" : "—"}
          </span>
          {notes && <span className="text-[11px] text-ui-text-muted ml-2">{notes}</span>}
        </div>
        <DraftReadOnly picks={gameResult.draft_picks} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-ui-border bg-ui-surface overflow-hidden">
      <div className="p-3 bg-ui-bg border-b border-ui-border flex items-center gap-3">
        <span className="text-xs font-bold text-ui-text whitespace-nowrap">Game {gameNumber}</span>
        
        <select
          value={isWin}
          onChange={(e) => setIsWin(e.target.value)}
          className={cn(
            "h-7 rounded-md border px-2 text-xs font-medium focus:outline-none transition-colors",
            isWin === "win" 
              ? "border-green-500/50 bg-green-500/10 text-green-400" 
              : isWin === "lose"
                ? "border-red-500/50 bg-red-500/10 text-red-400"
                : "border-ui-border bg-ui-surface text-ui-text-muted focus:border-yellow-400/50"
          )}
        >
          <option value="">Status</option>
          <option value="win">Menang</option>
          <option value="lose">Kalah</option>
        </select>
        
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan (opsional)"
          className="h-7 w-full max-w-[200px] rounded-md border border-ui-border bg-ui-surface px-2 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div className="p-3 space-y-4">
        <div className="-mx-2">
          <DraftSection
            draft={draft}
            attendingPlayers={attendingPlayers}
            onOurChange={handleOurChange}
            onEnemyChange={handleEnemyChange}
            onBanChange={handleBanChange}
          />
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-ui-border">
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="inline-flex h-7 items-center gap-1.5 rounded bg-yellow-400 px-4 text-xs font-bold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Simpan Game {gameNumber}
          </button>
          
          {gameResult && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex h-7 items-center gap-1.5 rounded border border-red-500/30 px-3 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 cursor-pointer ml-auto"
            >
              <Trash2 className="h-3 w-3" />
              Hapus
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && gameResult && (
        <ConfirmDeleteDialog
          open={showDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Hapus Game Result"
          message={`Hapus Game ${gameNumber}? Semua hero picks untuk game ini juga akan terhapus.`}
          confirmPhrase="HAPUS"
        />
      )}
    </div>
  );
}

// ─── DraftReadOnly ─────────────────────────────────────────────────────────────

function DraftReadOnly({ picks }: { picks: TournamentDraftPick[] }) {
  const ourPicks = picks.filter((p) => p.pick_type === "pick" && p.side === "our");
  const enemyPicks = picks.filter((p) => p.pick_type === "pick" && p.side === "opponent");
  const ourBans = picks.filter((p) => p.pick_type === "ban" && p.side === "our");
  const enemyBans = picks.filter((p) => p.pick_type === "ban" && p.side === "opponent");

  if (picks.length === 0) {
    return <p className="text-[11px] text-ui-text-muted italic">Belum ada draft picks.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Our side */}
      <div className="space-y-1.5 border-r border-ui-border pr-4">
        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Tim Kita</p>
        {ourBans.length > 0 && (
          <div className="flex gap-0.5 flex-wrap mb-2">
            {ourBans.map((p) => (
              <HeroPortrait key={p.id} heroName={p.hero_name} isBan />
            ))}
          </div>
        )}
        {ourPicks.map((p) => (
          <div key={p.id} className="flex items-center gap-2 py-0.5">
            <HeroPortrait heroName={p.hero_name} />
            <span className="text-[11px] font-medium text-ui-text truncate">{p.hero_name}</span>
            {p.role && (
              <span className="text-[10px] text-ui-text-muted ml-auto">({ROLE_LABELS[p.role as RoleName] ?? p.role})</span>
            )}
          </div>
        ))}
        {ourPicks.length === 0 && <p className="text-[10px] text-ui-text-muted">—</p>}
      </div>

      {/* Enemy side */}
      <div className="space-y-1.5 pl-2">
        <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Tim Lawan</p>
        {enemyBans.length > 0 && (
          <div className="flex gap-0.5 flex-wrap mb-2">
            {enemyBans.map((p) => (
              <HeroPortrait key={p.id} heroName={p.hero_name} isBan />
            ))}
          </div>
        )}
        {enemyPicks.map((p) => (
          <div key={p.id} className="flex items-center gap-2 py-0.5">
            <HeroPortrait heroName={p.hero_name} />
            <span className="text-[11px] font-medium text-ui-text truncate">{p.hero_name}</span>
            {p.role && (
              <span className="text-[10px] text-ui-text-muted ml-auto">({ROLE_LABELS[p.role as RoleName] ?? p.role})</span>
            )}
          </div>
        ))}
        {enemyPicks.length === 0 && <p className="text-[10px] text-ui-text-muted">—</p>}
      </div>
    </div>
  );
}

function HeroPortrait({ heroName, isBan = false }: { heroName: string; isBan?: boolean }) {
  return (
    <div
      className={cn(
        "h-6 w-6 overflow-hidden rounded-full border bg-zinc-800",
        isBan ? "border-red-500/40 opacity-50 grayscale" : "border-white/10",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/heroes/${heroName.replace(/ /g, "_")}.webp`}
        alt={heroName}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
