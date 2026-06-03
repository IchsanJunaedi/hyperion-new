"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateScrimVodLinkAction(
  scrimId: string,
  vodLink: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Unauthorized" };
  }

  // Check if user has permission (captain, manager, coach)
  const { data: scrim } = await supabase
    .from("scrims")
    .select("organization_id")
    .eq("id", scrimId)
    .maybeSingle();

  if (!scrim) {
    return { ok: false, message: "Scrim not found" };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("organization_id", scrim.organization_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!membership || !["captain", "manager", "coach", "owner"].includes(membership.role)) {
    return { ok: false, message: "Hanya coach, captain, atau manager yang bisa mengatur link VOD." };
  }

  const { error } = await supabase
    .from("scrims")
    .update({ vod_link: vodLink })
    .eq("id", scrimId);

  if (error) {
    console.error("Error updating VOD link:", error);
    return { ok: false, message: "Gagal menyimpan link VOD." };
  }

  revalidatePath(`/[team-slug]/(workspace)/scrim/[id]`, "page");
  return { ok: true };
}
