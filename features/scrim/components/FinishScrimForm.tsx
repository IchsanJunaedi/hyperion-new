"use client";

import { ArrowLeft, CheckCircle, Loader2, Plus, Trophy, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

import { finishScrimAction } from "../actions/finishScrimAction";
import { createClient } from "@/lib/supabase/client";

interface FinishScrimFormProps {
  scrimId: string;
  orgSlug: string;
  orgId: string;
  format: string;
  scrimId_detail: string;
}

interface GameResult {
  isWin: boolean | null;
  notes: string;
  imageUrl: string | null;
  uploading: boolean;
}

// ============================================================================
// BO Logic — Mobile Legends
// ============================================================================

/**
 * Returns the minimum games for a given format:
 * - BO1 → 1, BO2 → 2, BO3 → 2, BO5 → 3, BO7 → 4, 4match → 4
 *
 * In Mobile Legends BO systems:
 * - BO1: 1 game, done.
 * - BO2: Scrim format, always play 2 games regardless of result.
 * - BO3: First to 2 wins. Min = 2 (2-0), Max = 3 (1-1 then decider).
 * - BO5: First to 3 wins. Min = 3 (3-0), Max = 5.
 * - BO7: First to 4 wins. Min = 4 (4-0), Max = 7.
 * - 4Match: All 4 games always played (not elimination-based).
 */
type FormatConfig = {
  minGames: number;
  maxGames: number;
  winsNeeded: number | null;
  fixedGames: boolean;
};

const FORMAT_CONFIG: Record<string, FormatConfig> = {
  bo1:      { minGames: 1, maxGames: 1, winsNeeded: 1, fixedGames: true },
  bo2:      { minGames: 2, maxGames: 2, winsNeeded: null, fixedGames: true },
  bo3:      { minGames: 2, maxGames: 3, winsNeeded: 2, fixedGames: false },
  bo5:      { minGames: 3, maxGames: 5, winsNeeded: 3, fixedGames: false },
  bo7:      { minGames: 4, maxGames: 7, winsNeeded: 4, fixedGames: false },
  "4match": { minGames: 4, maxGames: 4, winsNeeded: null, fixedGames: true },
  scrimmage:{ minGames: 1, maxGames: 1, winsNeeded: 1, fixedGames: true },
};

const DEFAULT_CONFIG: FormatConfig = { minGames: 1, maxGames: 1, winsNeeded: 1, fixedGames: true };

function getConfig(format: string): FormatConfig {
  return FORMAT_CONFIG[format.toLowerCase()] ?? DEFAULT_CONFIG;
}

/** Given current results, compute if a winner has been decided (for BO formats). */
function isSeriesOver(games: GameResult[], config: ReturnType<typeof getConfig>): boolean {
  if (config.fixedGames) return false; // fixed formats never "end early"
  const wins = games.filter((g) => g.isWin === true).length;
  const losses = games.filter((g) => g.isWin === false).length;
  if (config.winsNeeded === null) return false;
  return wins >= config.winsNeeded || losses >= config.winsNeeded;
}

function makeBlankGame(): GameResult {
  return { isWin: null, notes: "", imageUrl: null, uploading: false };
}

export function FinishScrimForm({
  scrimId,
  orgSlug,
  orgId,
  format,
  scrimId_detail,
}: FinishScrimFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coachNotes, setCoachNotes] = useState("");

  const config = getConfig(format);

  const [games, setGames] = useState<GameResult[]>(
    Array.from({ length: config.minGames }, makeBlankGame),
  );

  // Auto-add a game when series is NOT over and we haven't hit max
  const seriesOver = isSeriesOver(games, config);
  const canAddMore = !config.fixedGames && games.length < config.maxGames && !seriesOver;

  function updateGame(index: number, update: Partial<GameResult>) {
    setGames((prev) => prev.map((g, i) => (i === index ? { ...g, ...update } : g)));
  }

  function addGame() {
    if (!canAddMore) return;
    setGames((prev) => [...prev, makeBlankGame()]);
  }

  function removeLastGame() {
    if (games.length <= config.minGames) return;
    setGames((prev) => prev.slice(0, -1));
  }

  async function handleImageUpload(index: number, file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setError("Gambar maksimal 10MB");
      return;
    }
    updateGame(index, { uploading: true });
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${orgId}/scrim-results/${scrimId}/game-${index + 1}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("org-private")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadErr) {
        setError(uploadErr.message);
        updateGame(index, { uploading: false });
        return;
      }
      updateGame(index, { imageUrl: path, uploading: false });
    } catch {
      setError("Gagal upload gambar");
      updateGame(index, { uploading: false });
    }
  }

  function handleSubmit() {
    const incomplete = games.some((g) => g.isWin === null);
    if (incomplete) {
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
        })),
        coachNotes: coachNotes || null,
      });
      if (res.ok) {
        toast.success("Hasil scrim disimpan!");
        router.push(`/${orgSlug}/analytics`);
      } else {
        setError(res.message ?? "Gagal menyimpan hasil");
      }
    });
  }

  const wins = games.filter((g) => g.isWin === true).length;
  const losses = games.filter((g) => g.isWin === false).length;

  const formatLabel = format.toUpperCase();

  return (
    <div className="mx-auto max-w-2xl w-full space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 px-5 py-3.5 shadow-xl shadow-black/20">
        <Trophy className="h-5 w-5 text-yellow-400 shrink-0" />
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-green-400">{wins}W</span>
          <span className="text-white/30">—</span>
          <span className="font-bold text-red-400">{losses}L</span>
          <span className="text-white/30">·</span>
          <span className="text-white/60 font-medium">{formatLabel}</span>
          <span className="text-white/30">·</span>
          <span className="text-white/40 text-xs">{games.length} game</span>
        </div>
        {seriesOver && (
          <span className="ml-auto text-xs font-semibold text-yellow-400 bg-yellow-400/10 rounded-full px-2.5 py-1 border border-yellow-400/20">
            Series Selesai
          </span>
        )}
      </div>

      {/* Per-game forms */}
      {games.map((game, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-xl shadow-black/20 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Game {i + 1}
              {game.isWin === true && (
                <span className="ml-2 text-xs text-green-400 font-normal">✓ Menang</span>
              )}
              {game.isWin === false && (
                <span className="ml-2 text-xs text-red-400 font-normal">✗ Kalah</span>
              )}
            </h3>
          </div>

          {/* Win/Loss toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateGame(i, { isWin: game.isWin === true ? null : true })}
              className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-all duration-150 ${
                game.isWin === true
                  ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Menang
            </button>
            <button
              type="button"
              onClick={() => updateGame(i, { isWin: game.isWin === false ? null : false })}
              className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-all duration-150 ${
                game.isWin === false
                  ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              <XCircle className="h-4 w-4" />
              Kalah
            </button>
          </div>

          {/* Notes */}
          <textarea
            value={game.notes}
            onChange={(e) => updateGame(i, { notes: e.target.value })}
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none resize-none"
          />

          {/* Image upload */}
          <div className="flex items-center gap-3">
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-white/60 hover:bg-white/5 transition-colors">
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(i, file);
                }}
                disabled={game.uploading}
              />
            </label>
            {game.imageUrl && (
              <span className="text-xs text-green-400 font-medium">✓ Uploaded</span>
            )}
          </div>
        </div>
      ))}

      {/* Add / Remove game buttons (only for non-fixed BO formats) */}
      {!config.fixedGames && (
        <div className="flex items-center gap-3">
          {canAddMore && (
            <button
              type="button"
              onClick={addGame}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Game {games.length + 1}
            </button>
          )}
          {games.length > config.minGames && (
            <button
              type="button"
              onClick={removeLastGame}
              className="text-xs text-white/30 hover:text-rose-400 transition-colors"
            >
              Hapus Game {games.length}
            </button>
          )}
          {!canAddMore && !seriesOver && (
            <p className="text-xs text-white/30">Sudah mencapai maksimum {config.maxGames} game</p>
          )}
        </div>
      )}

      {/* Coach notes */}
      <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 shadow-xl shadow-black/20 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          📋 Catatan Coach / Manager
        </h3>
        <textarea
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          rows={4}
          maxLength={3000}
          className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        disabled={pending}
        onClick={handleSubmit}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-yellow-400 px-6 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50 cursor-pointer shadow-lg shadow-yellow-400/20"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
        Simpan Hasil & Selesaikan Scrim
      </button>
    </div>
  );
}
