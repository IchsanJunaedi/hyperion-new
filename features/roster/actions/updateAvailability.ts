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

  // Fetch the member row to check ownership or access
  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("id, user_id, organization_id, role")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError || !member) {
    return { ok: false, message: "Member tidak ditemukan" };
  }

  // Allow self-update or hierarchical role update
  const isSelf = member.user_id === user.id;
  if (!isSelf) {
    const { data: callerMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("organization_id", member.organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const callerRole = callerMember?.role;
    const targetRole = member.role;

    const ownerEmail = process.env.OWNER_EMAIL;
    const isOwnerUser = ownerEmail && user.email === ownerEmail;

    const isAuthorized =
      isOwnerUser ||
      callerRole === "owner" ||
      (callerRole === "manager" && targetRole !== "owner") ||
      (callerRole === "captain" && targetRole !== "owner" && targetRole !== "manager");

    if (!isAuthorized) {
      return { ok: false, message: "Anda tidak memiliki izin untuk mengubah status member ini" };
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
