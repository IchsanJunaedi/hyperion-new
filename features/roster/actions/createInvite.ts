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

  // 1 Manager / 1 Captain per division limit
  if (raw.role === "manager" || raw.role === "captain") {
    let memberQuery = supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("role", raw.role)
      .eq("is_active", true);
      
    let inviteQuery = supabase
      .from("organization_invites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("role", raw.role)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());

    if (raw.division_id) {
      memberQuery = memberQuery.eq("division_id", raw.division_id);
      inviteQuery = inviteQuery.eq("division_id", raw.division_id);
    } else {
      memberQuery = memberQuery.is("division_id", null);
      inviteQuery = inviteQuery.is("division_id", null);
    }

    const [memberRes, inviteRes] = await Promise.all([memberQuery, inviteQuery]);
    
    const activeCount = memberRes.count ?? 0;
    const pendingCount = inviteRes.count ?? 0;

    if (activeCount + pendingCount >= 1) {
      const roleName = raw.role.charAt(0).toUpperCase() + raw.role.slice(1);
      return {
        ok: false,
        message: `Posisi ${roleName} sudah penuh (aktif/diundang). Maksimal 1 per divisi.`,
      };
    }
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
