"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface DraftPickInput {
  side: "our" | "enemy";
  role: string;
  hero_name: string;
}

interface GameInput {
  gameNumber: number;
  isWin: boolean;
  notes: string | null;
  imageUrl: string | null;
  draftPicks?: DraftPickInput[];
}

interface FinishScrimInput {
  scrimId: string;
  orgSlug: string;
  games: GameInput[];
  coachNotes: string | null;
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

  // Verify scrim exists and is not already completed
  const { data: scrim } = await admin
    .from("scrims")
    .select("id, status, organization_id")
    .eq("id", input.scrimId)
    .maybeSingle();

  if (!scrim) return { ok: false, message: "Scrim tidak ditemukan" };
  if (scrim.status === "completed") return { ok: false, message: "Scrim sudah selesai" };
  if (scrim.status === "cancelled") return { ok: false, message: "Scrim sudah dibatalkan" };

  // Calculate overall result
  const wins = input.games.filter((g) => g.isWin).length;
  const losses = input.games.filter((g) => !g.isWin).length;
  const overallWin = wins > losses ? true : wins < losses ? false : null;

  // Insert per-game results
  const gameRows = input.games.map((g) => ({
    scrim_id: input.scrimId,
    game_number: g.gameNumber,
    is_win: g.isWin,
    notes: g.notes,
    image_url: g.imageUrl,
  }));

  const { error: gameErr } = await admin
    .from("scrim_game_results")
    .upsert(gameRows, { onConflict: "scrim_id,game_number" });

  if (gameErr) return { ok: false, message: gameErr.message };

  // Upsert scrim_results (overall summary)
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

  // Update scrim status to completed
  const { error: statusErr } = await admin
    .from("scrims")
    .update({ status: "completed" })
    .eq("id", input.scrimId)
    .neq("status", "cancelled");

  if (statusErr) return { ok: false, message: statusErr.message };

  // Save draft picks (optional — skip silently if none)
  const draftRows = input.games.flatMap((g) =>
    (g.draftPicks ?? []).map((p) => ({
      scrim_id: input.scrimId,
      game_number: g.gameNumber,
      side: p.side,
      role: p.role,
      hero_name: p.hero_name,
    })),
  );
  if (draftRows.length > 0) {
    await admin
      .from("scrim_draft_picks")
      .upsert(draftRows, { onConflict: "scrim_id,game_number,side,role" });
  }

  revalidatePath(`/${input.orgSlug}/scrim/${input.scrimId}`);
  revalidatePath(`/${input.orgSlug}/scrim`);
  revalidatePath(`/${input.orgSlug}`);
  return { ok: true };
}
