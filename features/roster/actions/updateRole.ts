"use server";

import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/database";

export interface RosterActionError {
  ok: false;
  message: string;
}

export async function updateRoleAction(
  orgSlug: string,
  memberId: string,
  role: MemberRole,
): Promise<RosterActionError | { ok: true }> {
  if (role === "owner") {
    return { ok: false, message: "Role owner tidak bisa diassign manual" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const admin = createAdminClient();

  // Fetch target member to get org context
  const { data: targetMember, error: targetError } = await admin
    .from("team_members")
    .select("id, user_id, organization_id, role")
    .eq("id", memberId)
    .maybeSingle();

  if (targetError || !targetMember) {
    return { ok: false, message: "Member tidak ditemukan" };
  }

  // Verify caller has permission to change roles
  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwnerUser = ownerEmail && user.email === ownerEmail;

  if (!isOwnerUser) {
    const { data: callerMember } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", targetMember.organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const callerRole = callerMember?.role;
    const isAuthorized =
      callerRole === "owner" ||
      (callerRole === "manager" &&
        targetMember.role !== "owner" &&
        targetMember.role !== "manager");

    if (!isAuthorized) {
      return { ok: false, message: "Hanya owner atau manager yang bisa mengubah role" };
    }
  }

  const { error } = await admin
    .from("team_members")
    .update({ role })
    .eq("id", memberId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logAudit({
    actorId: user.id,
    action: "member.update_role",
    entityType: "team_member",
    entityId: memberId,
    metadata: {
      targetUserId: targetMember.user_id,
      fromRole: targetMember.role,
      toRole: role,
      orgId: targetMember.organization_id,
    },
  });

  revalidatePath(`/${orgSlug}/roster`);
  return { ok: true };
}
