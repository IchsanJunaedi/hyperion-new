"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/database";

export interface GenerateInviteLinkResult {
  ok: true;
  inviteUrl: string;
  token: string;
}

export interface GenerateInviteError {
  ok: false;
  message: string;
}

export async function generateInviteLinkAction(
  orgId: string,
  raw: { role: MemberRole; division_id?: string | null },
): Promise<GenerateInviteLinkResult | GenerateInviteError> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const admin = createAdminClient();

  // Verify caller is manager or owner of this org
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("role", ["manager", "owner"])
    .maybeSingle();

  if (!membership) {
    return { ok: false, message: "Hanya manager atau owner yang bisa membuat undangan." };
  }

  const { data, error } = await admin
    .from("organization_invites")
    .insert({
      organization_id: orgId,
      invited_by: user.id,
      division_id: raw.division_id ?? null,
      role: raw.role,
      email: null,
      phone_wa: null,
    })
    .select("token")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Gagal membuat link undangan." };
  }

  revalidatePath("/manage");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    ok: true,
    token: data.token,
    inviteUrl: `${appUrl}/invite/${data.token}`,
  };
}
