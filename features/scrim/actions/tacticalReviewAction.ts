"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateText, GeminiNotConfiguredError } from "@/lib/ai/gemini";
import type { DraftResult, ScoreboardResult } from "@/features/scrim/ai/screenshot-schema";
import type { Database } from "@/types/database";

const EDIT_ROLES = ["manager", "coach", "captain"];

export interface TacticalReviewGame {
  gameNumber: number;
  isWin: boolean;
  draft: DraftResult | null;
  scoreboard: ScoreboardResult | null;
}

function buildPrompt(g: TacticalReviewGame): string {
  return [
    "Anda adalah analis esports MLBB. Tulis review taktis singkat (3-5 kalimat, Bahasa Indonesia)",
    "yang membandingkan DRAFT (rencana) dengan EKSEKUSI (hasil scoreboard).",
    `Hasil game ${g.gameNumber}: ${g.isWin ? "MENANG" : "KALAH"}.`,
    `Draft kami: ${JSON.stringify(g.draft?.picks.our ?? {})}.`,
    `Draft lawan: ${JSON.stringify(g.draft?.picks.enemy ?? {})}.`,
    `Performa pemain kami (KDA): ${JSON.stringify(g.scoreboard?.players ?? [])}.`,
    `Performa pemain lawan (KDA): ${JSON.stringify(g.scoreboard?.enemyPlayers ?? [])}.`,
    "Fokus: apakah win condition draft tercapai, siapa yang over/underperform, dan 1 saran konkret.",
  ].join("\n");
}

export async function generateTacticalReviewAction(input: {
  scrimId: string;
  orgId: string;
  orgSlug: string;
  games: TacticalReviewGame[];
}): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const admin = createAdminClient();
  const isOwner = user.email === process.env.OWNER_EMAIL;
  if (!isOwner) {
    const { data: member } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", input.orgId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!member || !EDIT_ROLES.includes(member.role)) {
      return { ok: false, message: "Akses ditolak" };
    }
  }

  // Only review games that have at least a draft or scoreboard scan
  const reviewable = input.games.filter((g) => g.draft || g.scoreboard);
  if (reviewable.length === 0) return { ok: true }; // nothing to do, not an error

  try {
    const rows: Array<{
      scrim_id: string;
      game_number: number;
      narrative: string;
      scoreboard: ScoreboardResult | null;
      draft: DraftResult | null;
      created_by: string;
    }> = [];
    for (const g of reviewable) {
      const narrative = await generateText(buildPrompt(g));
      if (!narrative.trim()) continue;
      rows.push({
        scrim_id: input.scrimId,
        game_number: g.gameNumber,
        narrative: narrative.trim(),
        scoreboard: g.scoreboard,
        draft: g.draft,
        created_by: user.id,
      });
    }
    if (rows.length > 0) {
      const { error } = await admin
        .from("scrim_ai_reviews")
        .upsert(rows as Database["public"]["Tables"]["scrim_ai_reviews"]["Insert"][], { onConflict: "scrim_id,game_number" });
      if (error) {
        console.error("[tacticalReview] upsert error:", error.message);
        return { ok: false, message: error.message };
      }
    }
    revalidatePath(`/${input.orgSlug}/scrim/${input.scrimId}/results`);
    return { ok: true };
  } catch (err) {
    if (err instanceof GeminiNotConfiguredError) {
      return { ok: false, message: "Fitur AI belum aktif" };
    }
    console.error("[tacticalReview] gemini error:", err);
    return { ok: false, message: "Gagal membuat review taktis" };
  }
}
