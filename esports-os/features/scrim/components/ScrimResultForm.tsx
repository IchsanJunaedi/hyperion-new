"use client";

import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { submitResultAction } from "@/features/scrim/actions";

interface ScrimResultFormProps {
  orgSlug: string;
  scrimId: string;
  initial: {
    our_score: number;
    opponent_score: number;
    notes: string | null;
    performance_rating: number | null;
  } | null;
}

export function ScrimResultForm({
  orgSlug,
  scrimId,
  initial,
}: ScrimResultFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(
    initial?.performance_rating ?? null,
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const res = await submitResultAction(orgSlug, {
            scrim_id: scrimId,
            our_score: Number(fd.get("our_score") ?? 0),
            opponent_score: Number(fd.get("opponent_score") ?? 0),
            notes: fd.get("notes"),
            performance_rating: rating,
          });
          if (!res.ok) {
            setError(res.message);
            return;
          }
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-white/70">
          Skor kami
          <input
            type="number"
            name="our_score"
            required
            min={0}
            max={999}
            defaultValue={initial?.our_score ?? 0}
            className="mt-1 h-12 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-2xl font-bold text-white focus:border-yellow-400 focus:outline-none"
          />
        </label>
        <label className="block text-xs font-medium text-white/70">
          Skor lawan
          <input
            type="number"
            name="opponent_score"
            required
            min={0}
            max={999}
            defaultValue={initial?.opponent_score ?? 0}
            className="mt-1 h-12 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-2xl font-bold text-white focus:border-yellow-400 focus:outline-none"
          />
        </label>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-white/70">
          Rating performa
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Rating ${n}`}
              onClick={() => setRating(rating === n ? null : n)}
              className={`grid h-9 w-9 place-items-center rounded-full transition ${
                rating !== null && n <= rating
                  ? "bg-yellow-400/90 text-black"
                  : "bg-zinc-800 text-white/55 hover:text-white"
              }`}
            >
              <Star
                className="h-4 w-4"
                fill={rating !== null && n <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      <label className="block text-xs font-medium text-white/70">
        Catatan (opsional)
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={initial?.notes ?? ""}
          placeholder="Evaluasi singkat, MVP, area improvement"
          className="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-yellow-400 px-5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {initial ? "Update hasil" : "Simpan hasil"}
      </button>
    </form>
  );
}
