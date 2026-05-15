"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface RevokeInviteResult {
  ok: boolean;
  message?: string;
}

export async function revokeInviteAction(inviteId: string): Promise<RevokeInviteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir." };

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("organization_invites")
    .select("organization_id, status")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite) return { ok: false, message: "Undangan tidak ditemukan." };
  if (invite.status !== "pending") return { ok: false, message: "Undangan sudah tidak aktif." };

  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("organization_id", invite.organization_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("role", ["manager", "owner"])
    .maybeSingle();

  if (!membership) return { ok: false, message: "Akses ditolak." };

  const { error } = await admin
    .from("organization_invites")
    .update({ status: "expired" })
    .eq("id", inviteId)
    .eq("status", "pending");

  if (error) return { ok: false, message: error.message };

  revalidatePath("/manage");
  return { ok: true };
}
