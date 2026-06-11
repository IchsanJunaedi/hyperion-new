import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ScrimAiReview {
  game_number: number;
  narrative: string;
  created_at: string;
}

export async function getScrimAiReviews(scrimId: string): Promise<ScrimAiReview[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scrim_ai_reviews")
    .select("game_number, narrative, created_at")
    .eq("scrim_id", scrimId)
    .order("game_number", { ascending: true })
    .limit(30);
  if (error) {
    console.error("[getScrimAiReviews]", error.message);
    return [];
  }
  return data ?? [];
}
