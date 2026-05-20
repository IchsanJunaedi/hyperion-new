"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface DraftPickInput {
  side: "our" | "enemy";
  role: string;
  hero_name: string;
  player_id: string | null;
}

interface GameInput {
  gameNumber: number;
  isWin: boolean;
  notes: string | null;
  imageUrl: string | null;
  draftPicks?: DraftPickInput[];
}

interface PlayerEvalInput {
  userId: string;
  rating: number | null;
  coachNotes: string | null;
}

interface FinishScrimInput {
  scrimId: string;
  orgSlug: string;
  games: GameInput[];
  coachNotes: string | null;
  playerEvals?: PlayerEvalInput[];
}

export async function finishScrimAction(
  input: FinishScrimInput,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const admin = createAdminClient();

  const { data: scrim } = await admin
    .from("scrims")
    .select("id, status, organization_id")
    .eq("id", input.scrimId)
    .maybeSingle();

  if (!scrim) return { ok: false, message: "Scrim tidak ditemukan" };
  if (scrim.status === "completed") return { ok: false, message: "Scrim sudah selesai" };
  if (scrim.status === "cancelled") return { ok: false, message: "Scrim sudah dibatalkan" };

  const wins = input.games.filter((g) => g.isWin).length;
  const losses = input.games.filter((g) => !g.isWin).length;
  const overallWin = wins > losses ? true : wins < losses ? false : null;

  // Per-game results
  const { error: gameErr } = await admin
    .from("scrim_game_results")
    .upsert(
      input.games.map((g) => ({
        scrim_id: input.scrimId,
        game_number: g.gameNumber,
        is_win: g.isWin,
        notes: g.notes,
        image_url: g.imageUrl,
      })),
      { onConflict: "scrim_id,game_number" },
    );
  if (gameErr) return { ok: false, message: gameErr.message };

  // Overall result
  const { error: resultErr } = await admin
    .from("scrim_results")
    .upsert(
      {
        scrim_id: input.scrimId,
        our_score: wins,
        opponent_score: losses,
        is_win: overallWin,
        coach_notes: input.coachNotes,
        recorded_by: user.id,
      },
      { onConflict: "scrim_id" },
    );
  if (resultErr) return { ok: false, message: resultErr.message };

  // Mark scrim completed
  const { error: statusErr } = await admin
    .from("scrims")
    .update({ status: "completed" })
    .eq("id", input.scrimId)
    .neq("status", "cancelled");
  if (statusErr) return { ok: false, message: statusErr.message };

  // Draft picks (with player_id)
  const draftRows = input.games.flatMap((g) =>
    (g.draftPicks ?? []).map((p) => ({
      scrim_id: input.scrimId,
      game_number: g.gameNumber,
      side: p.side,
      role: p.role,
      hero_name: p.hero_name,
      player_id: p.player_id ?? null,
    })),
  );
  if (draftRows.length > 0) {
    const { error: draftErr } = await admin
      .from("scrim_draft_picks")
      .upsert(draftRows, { onConflict: "scrim_id,game_number,side,role" });
    if (draftErr) return { ok: false, message: draftErr.message };
  }

  // Per-player evaluations → upsert into scrim_attendances
  const evals = (input.playerEvals ?? []).filter(
    (e) => e.rating !== null || e.coachNotes,
  );
  if (evals.length > 0) {
    await admin
      .from("scrim_attendances")
      .upsert(
        evals.map((e) => ({
          scrim_id: input.scrimId,
          user_id: e.userId,
          rating: e.rating,
          coach_notes: e.coachNotes,
        })),
        { onConflict: "scrim_id,user_id", ignoreDuplicates: false },
      );
  }

  revalidatePath(`/${input.orgSlug}/scrim/${input.scrimId}`);
  revalidatePath(`/${input.orgSlug}/scrim`);
  revalidatePath(`/${input.orgSlug}/analytics`);
  revalidatePath(`/${input.orgSlug}`);
  return { ok: true };
}
