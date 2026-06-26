/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getScrimDetail } from "@/features/scrim/queries";
import { getCurrentUserRole } from "@/features/roster/queries";
import { FinishScrimForm } from "@/features/scrim/components/FinishScrimForm";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface FinishScrimPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function FinishScrimPage({ params }: FinishScrimPageProps) {
  const { "team-slug": slug, id } = await params;
  const detail = await getScrimDetail(id);
  if (!detail) notFound();

  const { scrim } = detail;

  const currentUserRole = await getCurrentUserRole(scrim.organization_id);
  const canFinish = ["captain", "coach", "manager", "owner"].includes(currentUserRole ?? "");
  if (!canFinish) redirect(`/${slug}/scrim/${id}`);

  if (scrim.status === "cancelled") {
    redirect(`/${slug}/scrim/${id}`);
  }

  const admin = createAdminClient() as any;

  // Load existing results if already completed
  let initialGames:
    | {
        isWin: boolean | null;
        notes: string;
        imageUrl: string | null;
        uploading: boolean;
        draft: {
          our: Record<string, { hero: string; playerId: string | null }>;
          enemy: Record<string, string>;
          bans: {
            our: string[];
            enemy: string[];
          };
        };
        scoreboard: null;
        durationSeconds: number | null;
      }[]
    | undefined = undefined;
  let initialCoachNotes: string | null = null;

  if (scrim.status === "completed") {
    const [gameResultsRes, draftPicksRes, draftBansRes, scrimResultRes] = await Promise.all([
      admin
        .from("scrim_game_results")
        .select("*")
        .eq("scrim_id", id)
        .order("game_number", { ascending: true }),
      admin
        .from("scrim_draft_picks")
        .select("*")
        .eq("scrim_id", id),
      admin
        .from("scrim_draft_bans")
        .select("*")
        .eq("scrim_id", id)
        .order("ban_order", { ascending: true }),
      admin
        .from("scrim_results")
        .select("coach_notes")
        .eq("scrim_id", id)
        .maybeSingle(),
    ]);

    const gameResults = gameResultsRes.data ?? [];
    const draftPicks = draftPicksRes.data ?? [];
    const draftBans = draftBansRes.data ?? [];
    initialCoachNotes = scrimResultRes.data?.coach_notes ?? null;

    if (gameResults.length > 0) {
      initialGames = gameResults.map((gr: { is_win: boolean; notes: string | null; image_url: string | null; game_number: number; duration_seconds: number | null }) => {
        const gamePicks = draftPicks.filter((p: { game_number: number }) => p.game_number === gr.game_number);
        const gameBans = draftBans.filter((b: { game_number: number }) => b.game_number === gr.game_number);

        const ourDraft: Record<string, { hero: string; playerId: string | null }> = {
          exp_lane: { hero: "", playerId: null },
          jungler: { hero: "", playerId: null },
          mid_lane: { hero: "", playerId: null },
          gold_lane: { hero: "", playerId: null },
          roamer: { hero: "", playerId: null },
        };
        const enemyDraft: Record<string, string> = {
          exp_lane: "",
          jungler: "",
          mid_lane: "",
          gold_lane: "",
          roamer: "",
        };

        gamePicks.forEach((pick: { side: string; role: string; hero_name: string; player_id: string | null }) => {
          if (pick.side === "our") {
            ourDraft[pick.role] = {
              hero: pick.hero_name,
              playerId: pick.player_id,
            };
          } else {
            enemyDraft[pick.role] = pick.hero_name;
          }
        });

        const ourBans = Array(5).fill("");
        const enemyBans = Array(5).fill("");
        gameBans.forEach((ban: { ban_order: number; side: string; hero_name: string }) => {
          const idx = ban.ban_order - 1;
          if (idx >= 0 && idx < 5) {
            if (ban.side === "our") {
              ourBans[idx] = ban.hero_name;
            } else {
              enemyBans[idx] = ban.hero_name;
            }
          }
        });

        return {
          isWin: gr.is_win,
          notes: gr.notes ?? "",
          imageUrl: gr.image_url,
          uploading: false,
          draft: {
            our: ourDraft,
            enemy: enemyDraft,
            bans: {
              our: ourBans,
              enemy: enemyBans,
            },
          },
          scoreboard: null,
          durationSeconds: gr.duration_seconds,
        };
      });
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      {/* Back button — same pill style as calendar */}
      <div className="flex justify-start">
        <Link
          href={`/${slug}/scrim/${id}`}
          className="group inline-flex items-center gap-2 rounded-full border border-ui-border bg-ui-surface/40 px-3.5 py-1.5 text-xs font-semibold text-ui-text-2 transition-all duration-300 hover:bg-ui-elevated/60 hover:text-ui-text"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke detail scrim
        </Link>
      </div>

      {/* Centered title */}
      <div className="mx-auto max-w-2xl w-full space-y-1">
        <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight">
          Selesai Pertandingan
        </h1>
        <p className="text-sm text-ui-text-2">
          vs {scrim.opponent_name} · {scrim.format.toUpperCase()}
        </p>
      </div>

      <FinishScrimForm
        scrimId={scrim.id}
        orgSlug={slug}
        orgId={scrim.organization_id}
        format={scrim.format}
        initialGames={initialGames}
        initialCoachNotes={initialCoachNotes}
      />
    </div>
  );
}
