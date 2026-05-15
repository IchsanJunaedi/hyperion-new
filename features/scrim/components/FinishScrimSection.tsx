"use client";

import { Loader2, Star, Trophy, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { submitResultAction } from "@/features/scrim/actions";
import { createClient } from "@/lib/supabase/client";
import type { ScrimResult } from "@/features/scrim/queries";
import type { Database } from "@/types/database";

type Scrim = Database["public"]["Tables"]["scrims"]["Row"];

interface FinishScrimSectionProps {
  scrim: Scrim;
  orgSlug: string;
  canManage: boolean;
  initialResult: ScrimResult | null;
  resultImageUrl: string | null;
}

export function FinishScrimSection({
  scrim,
  orgSlug,
  canManage,
  initialResult,
  resultImageUrl,
}: FinishScrimSectionProps) {
  const [pastDue, setPastDue] = useState(
    () => Date.now() >= new Date(scrim.scheduled_at).getTime(),
  );
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (scrim.status !== "scheduled" || pastDue) return;
    const delay = new Date(scrim.scheduled_at).getTime() - Date.now();
    if (delay <= 0) {
      setPastDue(true);
      return;
    }
    const id = setTimeout(() => setPastDue(true), delay);
    return () => clearTimeout(id);
  }, [scrim.scheduled_at, scrim.status, pastDue]);

  if (scrim.status === "completed") {
    if (!initialResult) return null;
    return <ResultDisplay result={initialResult} imageUrl={resultImageUrl} />;
  }

  if (scrim.status === "cancelled") return null;

  if (!canManage || (!pastDue && scrim.status !== "ongoing")) return null;

  if (!showForm) {
    return (
      <article className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Trophy className="h-4 w-4 text-yellow-400" />
          Pertandingan selesai?
        </h2>
        <p className="mt-1 text-xs text-white/55">
          Catat hasil dan tandai scrim sebagai selesai.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
        >
          <Trophy className="h-4 w-4" />
          Selesai Pertandingan
        </button>
      </article>
    );
  }

  return (
    <ResultForm
      scrimId={scrim.id}
      orgId={scrim.organization_id}
      orgSlug={orgSlug}
      onCancel={() => setShowForm(false)}
    />
  );
}

function ResultDisplay({
  result,
  imageUrl,
}: {
  result: ScrimResult;
  imageUrl: string | null;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Trophy className="h-4 w-4 text-yellow-400" />
        Hasil pertandingan
      </h2>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-3xl font-bold text-white">
            {result.our_score}{" "}
            <span className="text-white/45">—</span>{" "}
            {result.opponent_score}
          </p>
          <p
            className={`mt-1 text-xs font-semibold uppercase tracking-wide ${
              result.is_win === null
                ? "text-white/55"
                : result.is_win
                  ? "text-emerald-400"
                  : "text-rose-400"
            }`}
          >
            {result.is_win === null ? "Imbang" : result.is_win ? "Menang" : "Kalah"}
          </p>
        </div>
        {result.performance_rating !== null && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-4 w-4 ${
                  n <= (result.performance_rating ?? 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/20"
                }`}
              />
            ))}
          </div>
        )}
        {result.notes ? (
          <p className="whitespace-pre-line text-sm text-white/80">{result.notes}</p>
        ) : null}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Foto hasil pertandingan"
            className="mt-2 max-h-64 w-full rounded-lg border border-white/10 object-contain"
          />
        ) : null}
      </div>
    </article>
  );
}

type WinState = boolean | null | "unset";

function ResultForm({
  scrimId,
  orgId,
  orgSlug,
  onCancel,
}: {
  scrimId: string;
  orgId: string;
  orgSlug: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [isWin, setIsWin] = useState<WinState>("unset");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageError(null);
    if (!file) {
      setImageFile(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Ukuran file maksimal 2MB");
      setImageFile(null);
      e.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("Hanya file gambar yang diizinkan");
      setImageFile(null);
      e.target.value = "";
      return;
    }
    setImageFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImageError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      setError(null);

      let imagePath: string | null = null;
      if (imageFile) {
        const supabase = createClient();
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${orgId}/scrim-results/${scrimId}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("org-private")
          .upload(path, imageFile, { upsert: true });
        if (uploadErr) {
          setError("Gagal upload gambar: " + uploadErr.message);
          return;
        }
        imagePath = uploadData.path;
      }

      const res = await submitResultAction(orgSlug, {
        scrim_id: scrimId,
        our_score: Number(fd.get("our_score") ?? 0),
        opponent_score: Number(fd.get("opponent_score") ?? 0),
        is_win: isWin === "unset" ? null : isWin,
        notes: fd.get("notes"),
        performance_rating: rating,
        result_image_path: imagePath,
      });

      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  };

  const WIN_CHOICES: Array<{
    value: boolean | null;
    label: string;
    activeClass: string;
  }> = [
    { value: true, label: "Menang", activeClass: "bg-emerald-500 text-white" },
    { value: null, label: "Imbang", activeClass: "bg-zinc-600 text-white" },
    { value: false, label: "Kalah", activeClass: "bg-rose-500 text-white" },
  ];

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Trophy className="h-4 w-4 text-yellow-400" />
          Hasil pertandingan
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-white/45 transition hover:text-white/80"
          aria-label="Tutup form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-white/70">
            Skor kami
            <input
              type="number"
              name="our_score"
              required
              min={0}
              max={5}
              defaultValue={0}
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
              max={5}
              defaultValue={0}
              className="mt-1 h-12 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-2xl font-bold text-white focus:border-yellow-400 focus:outline-none"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-white/70">Hasil</p>
          <div className="flex flex-wrap gap-2">
            {WIN_CHOICES.map(({ value, label, activeClass }) => {
              const selected = isWin !== "unset" && isWin === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setIsWin((prev) =>
                      prev !== "unset" && prev === value ? "unset" : value,
                    )
                  }
                  className={`h-9 rounded-full px-4 text-sm font-medium transition ${
                    selected
                      ? activeClass
                      : "bg-zinc-800 text-white/70 hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-white/70">Rating performa</p>
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
            placeholder="Evaluasi singkat, MVP, area improvement"
            className="mt-1 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
          />
        </label>

        <div>
          <p className="mb-1 text-xs font-medium text-white/70">
            Upload hasil (gambar, maks 2MB)
          </p>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-white/20 bg-zinc-900/50 px-4 py-3 text-sm text-white/55 transition hover:border-white/35 hover:text-white/80">
            <Upload className="h-4 w-4 flex-none" />
            <span className="truncate">
              {imageFile ? imageFile.name : "Pilih gambar…"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          {imageFile ? (
            <button
              type="button"
              onClick={clearImage}
              className="mt-1 text-xs text-rose-400 hover:text-rose-300"
            >
              Hapus gambar
            </button>
          ) : null}
          {imageError ? (
            <p className="mt-1 text-xs text-rose-400">{imageError}</p>
          ) : null}
        </div>

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
          Simpan Hasil
        </button>
      </form>
    </article>
  );
}
