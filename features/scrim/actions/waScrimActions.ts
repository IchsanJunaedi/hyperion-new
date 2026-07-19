"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { DraftResult, ScoreboardResult } from "@/features/scrim/ai/screenshot-schema";
import type { Database } from "@/types/database";

type SessionRow = Database["public"]["Tables"]["wa_scrim_session_states"]["Row"];

/**
 * Start a WA scrim session — called when a scrim is ready for screenshot upload.
 * The bot will ask the coach for Game 1 draft screenshot.
 */
export async function startWaScrimSessionAction(input: {
  scrimId: string;
  phoneNumber: string;
}): Promise<{ ok: boolean; message?: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("wa_scrim_session_states")
    .upsert(
      {
        phone_number: input.phoneNumber,
        scrim_id: input.scrimId,
        current_game: 1,
        state: "waiting_draft",
        temp_draft_data: null,
        temp_scoreboard_data: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "phone_number" },
    );
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Save confirmed draft + scoreboard data for the current game, then advance
 * the session to the next game.
 *
 * Called from the WhatsApp webhook when the user replies "1" (SIMPOPAN).
 */
export async function saveConfirmedScrimGameAction(input: {
  phoneNumber: string;
}): Promise<{ ok: boolean; message?: string }> {
  const admin = createAdminClient();

  const { data: session, error: sessionErr } = await admin
    .from("wa_scrim_session_states")
    .select("*")
    .eq("phone_number", input.phoneNumber)
    .maybeSingle();
  if (sessionErr) return { ok: false, message: sessionErr.message };
  if (!session) return { ok: false, message: "Sesi WA tidak ditemukan" };

  const draft = session.temp_draft_data as DraftResult | null;
  const scoreboard = session.temp_scoreboard_data as ScoreboardResult | null;
  if (!scoreboard) return { ok: false, message: "Data scoreboard belum ada" };

  const gameNumber = session.current_game;

  // 1. Upsert per-game result
  const { error: gameErr } = await admin
    .from("scrim_game_results")
    .upsert(
      {
        scrim_id: session.scrim_id,
        game_number: gameNumber,
        is_win: scoreboard.isWin,
        result: scoreboard.isWin ? "win" : "lose",
        our_score: scoreboard.ourScore,
        enemy_score: scoreboard.opponentScore,
        duration_seconds: scoreboard.durationSeconds,
        vod_timestamp: null,
      },
      { onConflict: "scrim_id,game_number" },
    );
  if (gameErr) return { ok: false, message: gameErr.message };

  // 2. Delete old draft picks + bans for this game, then re-insert
  await admin
    .from("scrim_draft_picks")
    .delete()
    .eq("scrim_id", session.scrim_id)
    .eq("game_number", gameNumber);
  await admin
    .from("scrim_draft_bans")
    .delete()
    .eq("scrim_id", session.scrim_id)
    .eq("game_number", gameNumber);

  // 3. Insert draft picks (from scoreboard heroes)
  const pickRows: Database["public"]["Tables"]["scrim_draft_picks"]["Insert"][] =
    [];
  for (const p of scoreboard.players) {
    pickRows.push({
      scrim_id: session.scrim_id,
      game_number: gameNumber,
      side: "our",
      role: p.role,
      hero_name: p.heroName,
      player_id: null,
    });
  }
  for (const p of scoreboard.enemyPlayers) {
    pickRows.push({
      scrim_id: session.scrim_id,
      game_number: gameNumber,
      side: "enemy",
      role: p.role,
      hero_name: p.heroName,
      player_id: null,
    });
  }
  if (pickRows.length > 0) {
    const { error: pickErr } = await admin
      .from("scrim_draft_picks")
      .upsert(pickRows, { onConflict: "scrim_id,game_number,side,role" });
    if (pickErr) return { ok: false, message: pickErr.message };
  }

  // 4. Insert draft bans (from draft scan)
  const banRows: Database["public"]["Tables"]["scrim_draft_bans"]["Insert"][] =
    [];
  if (draft?.bans) {
    draft.bans.our.forEach((hero, i) => {
      if (hero) banRows.push({
        scrim_id: session.scrim_id,
        game_number: gameNumber,
        side: "our",
        ban_order: i + 1,
        hero_name: hero,
      });
    });
    draft.bans.enemy.forEach((hero, i) => {
      if (hero) banRows.push({
        scrim_id: session.scrim_id,
        game_number: gameNumber,
        side: "enemy",
        ban_order: i + 1,
        hero_name: hero,
      });
    });
  }
  if (banRows.length > 0) {
    const { error: banErr } = await admin.from("scrim_draft_bans").insert(banRows);
    if (banErr) return { ok: false, message: banErr.message };
  }

  // 5. Advance session to next game
  const { error: updateErr } = await admin
    .from("wa_scrim_session_states")
    .update({
      current_game: gameNumber + 1,
      state: "waiting_draft",
      temp_draft_data: null,
      temp_scoreboard_data: null,
      updated_at: new Date().toISOString(),
    })
    .eq("phone_number", input.phoneNumber);
  if (updateErr) return { ok: false, message: updateErr.message };

  return { ok: true };
}

/**
 * Reset the current game's temp data so the user can re-upload screenshots.
 */
export async function resetWaScrimGameAction(input: {
  phoneNumber: string;
}): Promise<{ ok: boolean; message?: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("wa_scrim_session_states")
    .update({
      state: "waiting_draft",
      temp_draft_data: null,
      temp_scoreboard_data: null,
      updated_at: new Date().toISOString(),
    })
    .eq("phone_number", input.phoneNumber);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Read the current session state for a phone number.
 */
export async function getWaScrimSessionAction(input: {
  phoneNumber: string;
}): Promise<SessionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("wa_scrim_session_states")
    .select("*")
    .eq("phone_number", input.phoneNumber)
    .maybeSingle();
  return data;
}
