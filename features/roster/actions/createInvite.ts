"use server";

import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/database";

export interface CreateInviteResult {
  ok: true;
  token: string;
  inviteUrl: string;
}

export interface InviteActionError {
  ok: false;
  message: string;
}

export async function createInviteAction(
  orgSlug: string,
  orgId: string,
  raw: {
    division_id?: string | null;
    role: MemberRole;
    email?: string | null;
    phone_wa?: string | null;
  },
): Promise<InviteActionError | CreateInviteResult> {
  if (!raw.email && !raw.phone_wa) {
    return { ok: false, message: "Email atau nomor WA harus diisi" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!member || !["owner", "manager"].includes(member.role)) {
    return { ok: false, message: "Hanya manager atau owner yang bisa membuat undangan" };
  }

  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: orgId,
      invited_by: user.id,
      division_id: raw.division_id ?? null,
      role: raw.role,
      email: raw.email ?? null,
      phone_wa: raw.phone_wa ?? null,
    })
    .select("token")
    .single();

  if (error || !data) {
    return {
      ok: false,
      message:
        error?.code === "42501"
          ? "Hanya manager atau owner yang bisa membuat undangan"
          : (error?.message ?? "Gagal membuat undangan"),
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    ok: true,
    token: data.token,
    inviteUrl: `${appUrl}/invite/${data.token}`,
  };
}
