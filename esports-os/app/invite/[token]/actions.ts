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

  // team_members has UNIQUE (organization_id, user_id, division_id) so a user
  // can hold seats across multiple divisions in the same org. We must scope
  // the existing-row probe to the invite's specific division (or null) so we
  // don't (a) get a multi-row error from .maybeSingle() when the user is
  // already in another division, and (b) skip the insert thinking they're
  // covered when in fact the invite is for a different division.
  const existingProbe = admin
    .from("team_members")
    .select("id")
    .eq("organization_id", invite.organization_id)
    .eq("user_id", user.id);
  const existing = await (invite.division_id
    ? existingProbe.eq("division_id", invite.division_id)
    : existingProbe.is("division_id", null)
  ).maybeSingle();

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

  // Race-safe: only flip pending → accepted. If another request already
  // rejected/expired this invite, leave it alone.
  const { error: updateErr } = await admin
    .from("organization_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id)
    .in("status", ["pending"]);
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

  // Server actions are HTTP endpoints, so we must auth-check here too
  // (parity with acceptInviteAction). Without this, anyone who guesses
  // or leaks a token could flip pending invites to rejected without
  // being logged in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi kamu sudah berakhir. Silakan masuk lagi." };
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
