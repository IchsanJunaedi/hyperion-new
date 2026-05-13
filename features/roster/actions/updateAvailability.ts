"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { MemberAvailability } from "@/types/database";

export interface ActionError {
  ok: false;
  message: string;
}

/**
 * Update a member's availability status. Members can update their own
 * availability; captains+ can update any member in their org.
 */
export async function updateAvailabilityAction(
  orgSlug: string,
  memberId: string,
  availability: MemberAvailability,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Validate the availability value
  const validValues: MemberAvailability[] = ["active", "hiatus", "unavailable"];
  if (!validValues.includes(availability)) {
    return { ok: false, message: "Status tidak valid" };
  }

  // Fetch the member row to check ownership or captain+ access
  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("id, user_id, organization_id")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError || !member) {
    return { ok: false, message: "Member tidak ditemukan" };
  }

  // Allow self-update or captain+ update
  const isSelf = member.user_id === user.id;
  if (!isSelf) {
    const { data: isCaptain } = await supabase.rpc("is_captain_or_above", {
      org_id: member.organization_id,
    });
    if (!isCaptain) {
      return { ok: false, message: "Anda hanya bisa mengubah status sendiri" };
    }
  }

  const { error } = await supabase
    .from("team_members")
    .update({ availability })
    .eq("id", memberId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/${orgSlug}/roster`);
  return { ok: true };
}
