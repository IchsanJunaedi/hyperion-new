import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getScrimDetail } from "@/features/scrim/queries";

export const dynamic = "force-dynamic";

interface ScrimResultsPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function ScrimResultsPage({ params }: ScrimResultsPageProps) {
  const { "team-slug": slug, id } = await params;
  const detail = await getScrimDetail(id);
  if (!detail) notFound();

  const { scrim, result } = detail;

  const admin = createAdminClient();

  // Get per-game results
  const { data: gameResults } = await admin
    .from("scrim_game_results")
    .select("*")
    .eq("scrim_id", id)
    .order("game_number", { ascending: true });

  // Get signed URLs for images
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

  const wins = gamesWithUrls.filter((g) => g.is_win).length;
  const losses = gamesWithUrls.filter((g) => !g.is_win).length;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-2">
        <Link
          href={`/${slug}/scrim/${id}`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Kembali ke detail scrim
        </Link>
        <h1 className="text-2xl font-bold text-white">
          Hasil Pertandingan
        </h1>
        <p className="text-sm text-white/65">
          vs {scrim.opponent_name} · {scrim.format.toUpperCase()}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-3xl font-bold text-white">{wins}</span>
          <span className="text-xl text-white/40">—</span>
          <span className="text-3xl font-bold text-white">{losses}</span>
          <span className={`ml-3 text-sm font-medium uppercase ${
            wins > losses ? "text-green-400" : wins < losses ? "text-red-400" : "text-white/50"
          }`}>
            {wins > losses ? "Menang" : wins < losses ? "Kalah" : "Imbang"}
          </span>
        </div>
      </header>

      {/* Per-game results */}
      <div className="space-y-4 max-w-2xl">
        {gamesWithUrls.map((game) => (
          <div
            key={game.id}
            className="rounded-xl border border-white/10 bg-zinc-900/40 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Game {game.game_number}</h3>
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                game.is_win
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}>
                {game.is_win ? (
                  <><CheckCircle className="h-3.5 w-3.5" /> Menang</>
                ) : (
                  <><XCircle className="h-3.5 w-3.5" /> Kalah</>
                )}
              </div>
            </div>

            {game.notes && (
              <p className="text-sm text-white/70 whitespace-pre-line">{game.notes}</p>
            )}

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
                  className="rounded-lg border border-white/10 max-h-[300px] object-contain"
                />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Coach notes */}
      {result?.coach_notes && (
        <div className="max-w-2xl rounded-xl border border-blue-400/20 bg-blue-400/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-2">📋 Catatan Coach</h3>
          <p className="text-sm text-white/80 whitespace-pre-line">{result.coach_notes}</p>
        </div>
      )}

      {gamesWithUrls.length === 0 && (
        <p className="text-sm text-white/40">Belum ada detail per-game.</p>
      )}
    </div>
  );
}
