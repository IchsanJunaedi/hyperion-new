"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CoachNotesResult {
  ok: boolean;
  message?: string;
}

export async function submitCoachNotesAction(
  scrimId: string,
  orgSlug: string,
  orgId: string,
  coachNotes: string,
): Promise<CoachNotesResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login." };

  // Verify user is coach, manager, or owner in this org
  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwnerByEmail = ownerEmail && user.email === ownerEmail;

  if (!isOwnerByEmail) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .in("role", ["coach", "manager"])
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) {
      return { ok: false, message: "Hanya Coach, Manager, atau Owner yang bisa mengisi catatan." };
    }
  }

  // Use admin client to bypass RLS for the update
  const admin = createAdminClient();

  // Try to update existing result first, then insert if none exists
  const { data: existing } = await admin
    .from("scrim_results")
    .select("id")
    .eq("scrim_id", scrimId)
    .maybeSingle();

  let error;
  if (existing) {
    // Update only the coach_notes field
    const result = await admin
      .from("scrim_results")
      .update({ coach_notes: coachNotes })
      .eq("scrim_id", scrimId);
    error = result.error;
  } else {
    // No result yet - insert a minimal row so coach_notes can be stored
    // This should only happen in rare edge cases; scores default to 0
    const result = await admin
      .from("scrim_results")
      .insert({
        scrim_id: scrimId,
        coach_notes: coachNotes,
        our_score: 0,
        opponent_score: 0,
        recorded_by: user.id,
      });
    error = result.error;
  }

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/scrim/${scrimId}`);
  return { ok: true };
}
