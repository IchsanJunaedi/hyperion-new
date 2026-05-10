"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AcceptInviteResult {
  error?: string;
}

export async function acceptInviteAction(
  token: string,
): Promise<AcceptInviteResult> {
  if (!token || token.length < 16) {
    return { error: "Token undangan tidak valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi kamu sudah berakhir. Silakan masuk lagi." };
  }

  const admin = createAdminClient();

  const inviteResp = await admin
    .from("organization_invites")
    .select(
      "id, organization_id, division_id, role, status, expires_at, email, phone_wa",
    )
    .eq("token", token)
    .maybeSingle();

  if (inviteResp.error) {
    return { error: inviteResp.error.message };
  }

  const invite = inviteResp.data;
  if (!invite) {
    return { error: "Link undangan tidak ditemukan atau sudah kadaluarsa." };
  }
  if (invite.status === "expired" || new Date(invite.expires_at) < new Date()) {
    if (invite.status !== "expired") {
      await admin
        .from("organization_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);
    }
    return { error: "Undangan ini sudah kadaluarsa." };
  }
  if (invite.status === "rejected") {
    return { error: "Undangan ini sebelumnya sudah ditolak." };
  }
  if (invite.status === "accepted") {
    const orgResp = await admin
      .from("organizations")
      .select("slug")
      .eq("id", invite.organization_id)
      .maybeSingle();
    redirect(orgResp.data?.slug ? `/${orgResp.data.slug}` : "/");
  }

  const existing = await admin
    .from("team_members")
    .select("id")
    .eq("organization_id", invite.organization_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.error) {
    return { error: existing.error.message };
  }

  if (!existing.data) {
    const { error: insertErr } = await admin.from("team_members").insert({
      organization_id: invite.organization_id,
      division_id: invite.division_id,
      user_id: user.id,
      role: invite.role,
    });
    if (insertErr) {
      return { error: insertErr.message };
    }
  }

  const { error: updateErr } = await admin
    .from("organization_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);
  if (updateErr) {
    return { error: updateErr.message };
  }

  await supabase.auth.refreshSession();

  const orgResp = await admin
    .from("organizations")
    .select("slug")
    .eq("id", invite.organization_id)
    .maybeSingle();

  redirect(orgResp.data?.slug ? `/${orgResp.data.slug}` : "/");
}

export async function rejectInviteAction(
  token: string,
): Promise<AcceptInviteResult> {
  if (!token || token.length < 16) {
    return { error: "Token undangan tidak valid." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("organization_invites")
    .update({ status: "rejected" })
    .eq("token", token)
    .in("status", ["pending"]);

  if (error) {
    return { error: error.message };
  }
  redirect("/");
}
