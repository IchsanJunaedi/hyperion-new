"use client";

import { CheckCircle, Loader2, Trophy, Upload, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { finishScrimAction } from "../actions/finishScrimAction";
import { createClient } from "@/lib/supabase/client";

interface FinishScrimFormProps {
  scrimId: string;
  orgSlug: string;
  orgId: string;
  totalGames: number;
  format: string;
}

interface GameResult {
  isWin: boolean | null;
  notes: string;
  imageUrl: string | null;
  uploading: boolean;
}

export function FinishScrimForm({
  scrimId,
  orgSlug,
  orgId,
  totalGames,
  format,
}: FinishScrimFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coachNotes, setCoachNotes] = useState("");
  const [games, setGames] = useState<GameResult[]>(
    Array.from({ length: totalGames }, () => ({
      isWin: null,
      notes: "",
      imageUrl: null,
      uploading: false,
    })),
  );

  function updateGame(index: number, update: Partial<GameResult>) {
    setGames((prev) =>
      prev.map((g, i) => (i === index ? { ...g, ...update } : g)),
    );
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

      const { data: signedData } = await supabase.storage
        .from("org-private")
        .createSignedUrl(path, 86400);

      updateGame(index, { imageUrl: path, uploading: false });
    } catch {
      setError("Gagal upload gambar");
      updateGame(index, { uploading: false });
    }
  }

  function handleSubmit() {
    // Validate all games have result
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
        router.push(`/${orgSlug}/scrim/${scrimId}`);
      } else {
        setError(res.message ?? "Gagal menyimpan hasil");
      }
    });
  }

  const wins = games.filter((g) => g.isWin === true).length;
  const losses = games.filter((g) => g.isWin === false).length;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <div className="text-sm text-white/70">
          <span className="font-semibold text-green-400">{wins}W</span>
          {" — "}
          <span className="font-semibold text-red-400">{losses}L</span>
          {" · "}
          {format.toUpperCase()}
        </div>
      </div>

      {/* Per-game forms */}
      {games.map((game, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-zinc-900/40 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white">Game {i + 1}</h3>

          {/* Win/Loss toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateGame(i, { isWin: true })}
              className={`inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium transition ${
                game.isWin === true
                  ? "bg-green-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Menang
            </button>
            <button
              type="button"
              onClick={() => updateGame(i, { isWin: false })}
              className={`inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium transition ${
                game.isWin === false
                  ? "bg-red-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
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
            placeholder="Catatan game ini (opsional)"
            className="w-full rounded border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
          />

          {/* Image upload */}
          <div className="flex items-center gap-3">
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded border border-white/10 px-3 text-xs text-white/60 hover:bg-white/5">
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
              <span className="text-xs text-green-400">✓ Uploaded</span>
            )}
          </div>
        </div>
      ))}

      {/* Coach notes */}
      <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          📋 Catatan Coach / Manager
        </h3>
        <textarea
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          rows={4}
          maxLength={3000}
          placeholder="Evaluasi performa tim, area perbaikan, catatan taktis... (opsional)"
          className="w-full rounded border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        disabled={pending}
        onClick={handleSubmit}
        className="inline-flex h-11 items-center gap-2 rounded bg-yellow-400 px-6 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
        Simpan Hasil & Selesaikan Scrim
      </button>
    </div>
  );
}
