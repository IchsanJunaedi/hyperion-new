"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  cancelInviteSchema,
  inviteMemberSchema,
  removeMemberSchema,
  setMemberStatusSchema,
  updateMemberPositionSchema,
  updateMemberRoleSchema,
} from "@/lib/validations/roster";

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface InviteCreated {
  ok: true;
  invite: {
    id: string;
    token: string;
    expires_at: string;
    accept_url: string;
  };
}

/**
 * Time-limited invite token. We use a hex string (no padding chars that
 * complicate URLs) and length 24 bytes (48 hex chars) so guessing is
 * cryptographically infeasible even given a fast oracle.
 */
function generateInviteToken(): string {
  return randomBytes(24).toString("hex");
}

function inviteExpiresAt(): string {
  // 7 days from now
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

function buildAcceptUrl(token: string): string {
  // Prefer the public site URL when configured (used by WA messages /
  // emails that fly out from the worker). Falls back to a relative
  // path which is fine when surfaced inside the workspace.
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/invite/${token}`;
}

/**
 * Create an invite + (if WA channel) enqueue a Fonnte message via the
 * `notifications` table. Captain+ only — RLS enforces.
 */
export async function inviteMemberAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | InviteCreated> {
  const parsed = inviteMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { ok: false, message: "Organisasi tidak ditemukan" };

  const token = generateInviteToken();
  const expires_at = inviteExpiresAt();

  const { data: invite, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: org.id,
      division_id: parsed.data.division_id,
      invited_by: user.id,
      email: parsed.data.email,
      phone_wa: parsed.data.phone_wa,
      role: parsed.data.role,
      token,
      expires_at,
    })
    .select("id, token, expires_at")
    .single();
  if (error || !invite) {
    return {
      ok: false,
      message:
        error?.code === "42501"
          ? "Hanya captain atau owner yang bisa mengundang"
          : (error?.message ?? "Gagal membuat undangan"),
    };
  }

  const acceptUrl = buildAcceptUrl(invite.token);

  // Best-effort fan-out: when the invite is via WA, enqueue a Fonnte
  // message. Failure here doesn't block the invite — captain can copy
  // the link from the pending-invites list and share it manually.
  if (parsed.data.channel === "wa" && parsed.data.phone_wa) {
    const waMessage = [
      `[${org.name}] Undangan bergabung sebagai ${parsed.data.role}`,
      "",
      "Klik link berikut untuk menerima undangan (berlaku 7 hari):",
      acceptUrl,
    ].join("\n");
    // We use the admin client because the recipient may not exist as a
    // user yet — there's no user_id to attribute the notification to,
    // and RLS on `notifications` requires user_id. We bypass with the
    // service role and set user_id = the inviter so it shows up in
    // their own outbox monitoring view in Step 8.
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      organization_id: org.id,
      user_id: user.id,
      type: "invite",
      title: `Invite terkirim ke ${parsed.data.phone_wa}`,
      body: `Role: ${parsed.data.role}`,
      ref_id: invite.id,
      ref_type: "invite",
      wa_number: parsed.data.phone_wa,
      wa_message: waMessage,
    });
  }

  revalidatePath(`/${orgSlug}/roster`);
  return {
    ok: true,
    invite: {
      id: invite.id,
      token: invite.token,
      expires_at: invite.expires_at,
      accept_url: acceptUrl,
    },
  };
}

export async function updateMemberRoleAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updateMemberRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Input tidak valid",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Don't allow demoting the org owner via this endpoint — owner
  // transfer is a separate, deliberate flow (Step 8 / settings).
  const { data: target } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("id", parsed.data.member_id)
    .maybeSingle();
  if (!target) return { ok: false, message: "Member tidak ditemukan" };
  if (target.role === "owner") {
    return {
      ok: false,
      message: "Role owner tidak bisa diubah dari sini",
    };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.member_id)
    .neq("role", "owner");
  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa mengubah role"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/roster`);
  revalidatePath(`/${orgSlug}/roster/${parsed.data.member_id}`);
  return { ok: true };
}

export async function updateMemberPositionAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updateMemberPositionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Input tidak valid",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("team_members")
    .update({
      position: parsed.data.position,
      jersey_number: parsed.data.jersey_number,
    })
    .eq("id", parsed.data.member_id);
  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa mengatur posisi"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/roster`);
  revalidatePath(`/${orgSlug}/roster/${parsed.data.member_id}`);
  return { ok: true };
}

export async function setMemberStatusAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = setMemberStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Input tidak valid" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Block toggling the owner's active flag.
  const { data: target } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("id", parsed.data.member_id)
    .maybeSingle();
  if (!target) return { ok: false, message: "Member tidak ditemukan" };
  if (target.role === "owner") {
    return { ok: false, message: "Owner tidak bisa dinonaktifkan" };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.member_id)
    .neq("role", "owner");
  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa mengubah status member"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/roster`);
  revalidatePath(`/${orgSlug}/roster/${parsed.data.member_id}`);
  return { ok: true };
}

export async function removeMemberAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = removeMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Input tidak valid" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data: target } = await supabase
    .from("team_members")
    .select("id, role, user_id")
    .eq("id", parsed.data.member_id)
    .maybeSingle();
  if (!target) return { ok: false, message: "Member tidak ditemukan" };
  if (target.role === "owner") {
    return {
      ok: false,
      message:
        "Owner tidak bisa dihapus dari workspace. Transfer kepemilikan terlebih dulu.",
    };
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", parsed.data.member_id)
    .neq("role", "owner");
  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya owner atau member itu sendiri yang bisa keluar"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/roster`);
  return { ok: true };
}

export async function cancelInviteAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = cancelInviteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Input tidak valid" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Only allow cancelling invites that are still pending. RLS gates
  // who can update; the .in() guard prevents flipping accepted /
  // rejected / already-expired rows.
  const { error } = await supabase
    .from("organization_invites")
    .update({ status: "expired" })
    .eq("id", parsed.data.invite_id)
    .in("status", ["pending"]);
  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa membatalkan undangan"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/roster`);
  return { ok: true };
}
