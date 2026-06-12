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
  // Targeted invites may only be accepted by the invited account —
  // without this, anyone holding the link could claim the role (SEC-01).
  if (invite.email && invite.email !== user.email) {
    return { error: "Undangan ini bukan untuk akun Anda." };
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

  // Step 1 — Atomically claim the invite (pending → accepted).
  // We do this BEFORE the membership insert so that a concurrent
  // rejectInviteAction can't sneak in and flip the row to 'rejected'
  // after we've already added the user to team_members. The .select()
  // is what lets us see whether any row was actually updated; without
  // it Supabase returns a no-op success and we can't distinguish "row
  // claimed" from "someone else claimed it first".
  const claim = await admin
    .from("organization_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id)
    .in("status", ["pending"])
    .select("id");

  if (claim.error) {
    return { error: claim.error.message };
  }
  if (!claim.data || claim.data.length === 0) {
    return {
      error:
        "Undangan sudah tidak berlaku (mungkin sudah ditolak atau diterima dari sesi lain).",
    };
  }

  // Step 2 — Insert team_members. team_members has UNIQUE
  // (organization_id, user_id, division_id) so a user can hold seats
  // across multiple divisions in the same org. We scope the existing
  // probe to the invite's specific division (or null) to (a) avoid a
  // multi-row error from .maybeSingle() when the user already holds
  // a seat in another division, and (b) actually insert into the
  // targeted division when they don't have one yet.
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
    // Roll back the claim so the invite can be retried.
    await admin
      .from("organization_invites")
      .update({ status: "pending" })
      .eq("id", invite.id);
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
      // Roll back the claim so the invite can be retried.
      await admin
        .from("organization_invites")
        .update({ status: "pending" })
        .eq("id", invite.id);
      return { error: insertErr.message };
    }
  }

  await supabase.auth.refreshSession();

  const orgResp = await admin
    .from("organizations")
    .select("name, slug")
    .eq("id", invite.organization_id)
    .maybeSingle();

  // Audit Log: Member Joined
  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "member_joined",
    entityType: "organization",
    entityId: invite.organization_id,
    metadata: {
      orgName: orgResp.data?.name,
      role: invite.role,
      divisionId: invite.division_id,
    },
  });

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

  // Verify caller is the invite recipient
  const { data: invite } = await admin
    .from("organization_invites")
    .select("email, phone_wa, status")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return { error: "Undangan tidak ditemukan." };
  }
  if (invite.email && invite.email !== user.email) {
    return { error: "Undangan ini bukan untuk akun Anda." };
  }

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
