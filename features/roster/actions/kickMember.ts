"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export interface RosterActionError {
  ok: false;
  message: string;
}

/**
 * Remove a member from the org.
 * Hierarchy allowed:
 * - Owner can kick anyone.
 * - Manager can kick captain, member, coach (anyone except owner or other managers).
 * - Self-leave is allowed for anyone except owner.
 */
export async function kickMemberAction(
  orgSlug: string,
  memberId: string,
): Promise<RosterActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const admin = createAdminClient();

  // Fetch the target member's details (query only columns existing in team_members)
  const { data: targetMember, error: targetError } = await admin
    .from("team_members")
    .select("id, user_id, organization_id, role")
    .eq("id", memberId)
    .maybeSingle();

  if (targetError || !targetMember) {
    return { ok: false, message: "Member tidak ditemukan" };
  }

  // Fetch the profile for display name and username in audit logs
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, username")
    .eq("id", targetMember.user_id)
    .maybeSingle();

  const isSelf = targetMember.user_id === user.id;

  if (isSelf) {
    // Self-leave: Owner cannot leave
    if (targetMember.role === "owner") {
      return { ok: false, message: "Owner tidak bisa keluar dari tim" };
    }
  } else {
    // Administrative kick: Need to verify caller's role
    const { data: callerMember } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", targetMember.organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const callerRole = callerMember?.role;
    const targetRole = targetMember.role;

    const ownerEmail = process.env.OWNER_EMAIL;
    const isOwnerUser = ownerEmail && user.email === ownerEmail;

    const isAuthorized =
      isOwnerUser ||
      callerRole === "owner" ||
      (callerRole === "manager" && targetRole !== "owner" && targetRole !== "manager");

    if (!isAuthorized) {
      return { ok: false, message: "Anda tidak memiliki izin untuk mengeluarkan member ini" };
    }
  }

  // Perform deletion using Admin client (bypasses RLS safely after our manual checks)
  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return { ok: false, message: error.message };
  }

  // Create Audit Log
  const targetName = profile?.display_name ?? profile?.username ?? "Unnamed Member";
  await logAudit({
    actorId: user.id,
    action: isSelf ? "member_left" : "member_kicked",
    entityType: "team_member",
    entityId: memberId,
    metadata: {
      org_slug: orgSlug,
      target_user_id: targetMember.user_id,
      target_name: targetName,
      target_role: targetMember.role,
    },
  });

  revalidatePath(`/${orgSlug}/roster`);
  return { ok: true };
}
