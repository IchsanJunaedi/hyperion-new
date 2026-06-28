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
  bans?: { our: string[]; enemy: string[] };
  durationSeconds?: number | null;
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
  if (scrim.status === "cancelled") return { ok: false, message: "Scrim sudah dibatalkan" };

  const isOwner = user.email === process.env.OWNER_EMAIL;
  if (!isOwner) {
    const { data: membership } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", scrim.organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!membership || !["owner", "coach", "captain", "manager"].includes(membership.role)) {
      return { ok: false, message: "Hanya owner, coach, captain, atau manager yang bisa menyelesaikan scrim" };
    }
  }

  // Delete existing records to prevent orphans when editing
  await admin.from("scrim_game_results").delete().eq("scrim_id", input.scrimId);
  await admin.from("scrim_draft_picks").delete().eq("scrim_id", input.scrimId);
  await admin.from("scrim_draft_bans").delete().eq("scrim_id", input.scrimId);

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
        duration_seconds: g.durationSeconds ?? null,
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
    const { error: evalErr } = await admin
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
    if (evalErr) return { ok: false, message: evalErr.message };
  }

  // Ban data → scrim_draft_bans
  const banRows = input.games.flatMap((g) => {
    const rows: Array<{
      scrim_id: string;
      game_number: number;
      side: "our" | "enemy";
      hero_name: string;
      ban_order: number;
    }> = [];
    (g.bans?.our ?? []).forEach((hero, idx) => {
      if (hero) rows.push({ scrim_id: input.scrimId, game_number: g.gameNumber, side: "our", hero_name: hero, ban_order: idx + 1 });
    });
    (g.bans?.enemy ?? []).forEach((hero, idx) => {
      if (hero) rows.push({ scrim_id: input.scrimId, game_number: g.gameNumber, side: "enemy", hero_name: hero, ban_order: idx + 1 });
    });
    return rows;
  });
  if (banRows.length > 0) {
    const { error: banErr } = await admin
      .from("scrim_draft_bans")
      .upsert(banRows, { onConflict: "scrim_id,game_number,side,ban_order" });
    if (banErr) return { ok: false, message: banErr.message };
  }

  revalidatePath(`/${input.orgSlug}/scrim/${input.scrimId}`);
  revalidatePath(`/${input.orgSlug}/scrim`);
  revalidatePath(`/${input.orgSlug}/analytics`);
  revalidatePath(`/${input.orgSlug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
