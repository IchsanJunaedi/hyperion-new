"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_SUMMARY_LEN = 5000;

/**
 * Updates the overall coach summary for a scrim. Editable by
 * coach / captain / manager / owner only. Members can read but not write.
 */
export async function updateCoachSummaryAction(
  scrimId: string,
  summary: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "Unauthorized" };

  const trimmed = summary.trim();
  if (trimmed.length > MAX_SUMMARY_LEN) {
    return { ok: false, message: `Catatan maksimal ${MAX_SUMMARY_LEN} karakter.` };
  }

  const { data: scrim } = await supabase
    .from("scrims")
    .select("organization_id")
    .eq("id", scrimId)
    .maybeSingle();

  if (!scrim) return { ok: false, message: "Scrim tidak ditemukan." };

  // Global owner (env-based) bypasses the membership check.
  const ownerEmail = process.env.OWNER_EMAIL || process.env.E2E_OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);

  if (!isOwner) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("organization_id", scrim.organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership || !["captain", "manager", "coach", "owner"].includes(membership.role)) {
      return {
        ok: false,
        message: "Hanya coach, captain, atau manager yang bisa mengisi catatan coach.",
      };
    }
  }

  const { error } = await supabase
    .from("scrims")
    .update({ coach_summary: trimmed.length > 0 ? trimmed : null })
    .eq("id", scrimId);

  if (error) {
    console.error("Error updating coach summary:", error);
    return { ok: false, message: "Gagal menyimpan catatan coach." };
  }

  revalidatePath(`/[team-slug]/(workspace)/scrim/[id]`, "page");
  return { ok: true };
}
