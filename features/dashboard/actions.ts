"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MemberRole } from "@/types/database";

export interface ActionError {
  ok: false;
  message: string;
}

const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

type RateLimitRow = { attempts: number; locked_until: string | null };

async function getRateLimit(email: string): Promise<RateLimitRow | null> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("login_rate_limits")
    .select("attempts, locked_until")
    .eq("identifier", email)
    .maybeSingle();
  return data ?? null;
}

async function recordFailedAttempt(email: string, current: RateLimitRow | null): Promise<void> {
  const admin = createAdminClient();
  const now = new Date();

  const lockExpired =
    current?.locked_until ? new Date(current.locked_until) <= now : true;
  const prevAttempts = lockExpired ? 0 : (current?.attempts ?? 0);
  const newAttempts = prevAttempts + 1;
  const lockedUntil =
    newAttempts >= MAX_ATTEMPTS
      ? new Date(now.getTime() + LOCK_DURATION_MS).toISOString()
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("login_rate_limits").upsert({
    identifier: email,
    attempts: newAttempts,
    locked_until: lockedUntil,
    updated_at: now.toISOString(),
  });
}

async function clearRateLimit(email: string): Promise<void> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("login_rate_limits")
    .delete()
    .eq("identifier", email);
}

/**
 * Login action specifically for the /dashboard page.
 * Uses Supabase auth signInWithPassword. After login, page refreshes
 * and the server component checks owner role.
 */
export async function dashboardLoginAction(input: {
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  const email = input.email;

  // 1. Rate limit check
  const rateLimit = await getRateLimit(email);
  if (rateLimit?.locked_until) {
    const lockedUntil = new Date(rateLimit.locked_until);
    if (lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (lockedUntil.getTime() - Date.now()) / 60_000,
      );
      return {
        error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${minutesLeft} menit.`,
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    await recordFailedAttempt(email, rateLimit);

    const prevAttempts = rateLimit?.attempts ?? 0;
    const lockExpired =
      rateLimit?.locked_until != null &&
      new Date(rateLimit.locked_until) <= new Date();
    const effectivePrev = lockExpired ? 0 : prevAttempts;
    const newAttempts = effectivePrev + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      return {
        error: `Terlalu banyak percobaan gagal. Akun dikunci selama 1 jam.`,
      };
    }

    const remaining = MAX_ATTEMPTS - newAttempts;
    return { error: `Email atau password salah. Sisa percobaan: ${remaining}.` };
  }

  await clearRateLimit(email);
  return {};
}

/**
 * Assign a role to a user in an organization. Owner-only action.
 * Owner can assign any role: manager, coach, captain, member.
 */
export async function assignRoleAction(input: {
  userId: string;
  organizationId: string;
  divisionId: string | null;
  role: MemberRole;
  mainRole?: string | null;
}): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Verify caller is owner by email
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner yang bisa assign role dari dashboard" };
  }

  // Don't allow assigning owner role
  if (input.role === "owner") {
    return { ok: false, message: "Tidak bisa assign role Owner" };
  }

  // Enforce: only 1 captain per team
  const adminForCheck = createAdminClient();
  if (input.role === "captain" || input.role === "manager" || input.role === "coach") {
    const { data: existingRole } = await adminForCheck
      .from("team_members")
      .select("id, user_id")
      .eq("organization_id", input.organizationId)
      .eq("role", input.role)
      .eq("is_active", true)
      .maybeSingle();

    if (existingRole && existingRole.user_id !== input.userId) {
      // Remove old holder entirely — they lose all access to this org
      await adminForCheck
        .from("team_members")
        .delete()
        .eq("id", existingRole.id);
    }
  }

  // Enforce: only 1 player per main_role per team
  if (input.mainRole) {
    const { data: existingMainRole } = await adminForCheck
      .from("team_members")
      .select("id, user_id")
      .eq("organization_id", input.organizationId)
      .eq("main_role", input.mainRole)
      .eq("is_active", true)
      .maybeSingle();

    if (existingMainRole && existingMainRole.user_id !== input.userId) {
      // Set the main_role of the other user to NULL since this user is taking it
      await adminForCheck
        .from("team_members")
        .update({ main_role: null })
        .eq("id", existingMainRole.id);
    }
  }

  const admin = createAdminClient();

  // Check if user already has a membership in this org
  const { data: existing } = await admin
    .from("team_members")
    .select("id, role")
    .eq("user_id", input.userId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (existing) {
    // Update existing membership
    const { error } = await admin
      .from("team_members")
      .update({
        role: input.role,
        division_id: input.divisionId,
        is_active: true,
        main_role: input.mainRole || null,
      })
      .eq("id", existing.id);

    if (error) return { ok: false, message: error.message };
  } else {
    // Create new membership
    const { error } = await admin
      .from("team_members")
      .insert({
        user_id: input.userId,
        organization_id: input.organizationId,
        division_id: input.divisionId,
        role: input.role,
        is_active: true,
        main_role: input.mainRole || null,
      });

    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Create a new team/organization. Owner-only action.
 */
export async function createTeamAction(input: {
  name: string;
  slug: string;
  tier: "pelajar" | "komunitas" | "pro";
  divisions: Array<{ name: string; game: string }>;
}): Promise<ActionError | { ok: true; orgId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Verify caller is owner by email
  const ownerEmailCheck = process.env.OWNER_EMAIL;
  if (!ownerEmailCheck || user.email !== ownerEmailCheck) {
    return { ok: false, message: "Hanya Owner yang bisa membuat tim baru" };
  }

  const admin = createAdminClient();

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      tier: input.tier,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (orgErr || !org) {
    if (orgErr?.code === "23505") {
      return { ok: false, message: "Slug sudah dipakai" };
    }
    return { ok: false, message: orgErr?.message ?? "Gagal membuat tim" };
  }

  // Create divisions
  if (input.divisions.length > 0) {
    const divRows = input.divisions.map((d) => ({
      organization_id: org.id,
      name: d.name,
      slug: d.name.toLowerCase().replace(/\s+/g, "-"),
      game: d.game,
    }));
    await admin.from("divisions").insert(divRows);
  }

  // Add owner as member
  await admin.from("team_members").insert({
    user_id: user.id,
    organization_id: org.id,
    role: "owner",
    is_active: true,
  });

  revalidatePath("/dashboard");
  return { ok: true, orgId: org.id };
}


/**
 * Manager-level role assignment. Managers can only assign captain and member roles.
 */
export async function managerAssignRoleAction(input: {
  userId: string;
  organizationId: string;
  divisionId: string | null;
  role: MemberRole;
}): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Verify caller is manager or owner of this org (via team_members OR by owner email)
  const ownerEmailCheck = process.env.OWNER_EMAIL;
  const isOwnerByEmail = ownerEmailCheck && user.email === ownerEmailCheck;

  if (!isOwnerByEmail) {
    const { data: callerMembership } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", input.organizationId)
      .in("role", ["manager", "owner"])
      .eq("is_active", true)
      .maybeSingle();

    if (!callerMembership) {
      return { ok: false, message: "Hanya Manager atau Owner yang bisa assign member" };
    }
  }

  // Manager can only assign captain and member
  if (input.role !== "captain" && input.role !== "member") {
    return { ok: false, message: "Manager hanya bisa assign role Captain atau Member" };
  }

  const admin = createAdminClient();

  // Enforce: only 1 captain per team
  if (input.role === "captain") {
    const { data: existingCaptain } = await admin
      .from("team_members")
      .select("id, user_id")
      .eq("organization_id", input.organizationId)
      .eq("role", "captain")
      .eq("is_active", true)
      .maybeSingle();

    if (existingCaptain && existingCaptain.user_id !== input.userId) {
      return { ok: false, message: "Tim ini sudah punya Captain. Hanya 1 Captain per tim." };
    }
  }

  // Check if user already has a membership in this org
  const { data: existing } = await admin
    .from("team_members")
    .select("id, role")
    .eq("user_id", input.userId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (existing) {
    // Don't allow downgrading owner/manager/coach
    if (["owner", "manager", "coach"].includes(existing.role)) {
      return { ok: false, message: "Tidak bisa mengubah role yang lebih tinggi" };
    }
    const { error } = await admin
      .from("team_members")
      .update({
        role: input.role,
        division_id: input.divisionId,
        is_active: true,
      })
      .eq("id", existing.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await admin
      .from("team_members")
      .insert({
        user_id: input.userId,
        organization_id: input.organizationId,
        division_id: input.divisionId,
        role: input.role,
        is_active: true,
      });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/manage");
  return { ok: true };
}


/**
 * Update organization settings (name, tier, logo). Owner-only.
 */
export async function updateOrgAction(
  orgId: string,
  data: {
    name?: string;
    tier?: "pelajar" | "komunitas" | "pro";
    logo_url?: string | null;
    banner_url?: string | null;
    description?: string | null;
    game_focus?: string[] | null;
    is_public?: boolean;
  },
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Permission Check: Owner or Manager
  const ownerEmailCheck = process.env.OWNER_EMAIL || process.env.E2E_OWNER_EMAIL;
  const isOwnerByEmail = ownerEmailCheck && user.email === ownerEmailCheck;

  if (!isOwnerByEmail) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .eq("role", "manager")
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) {
      return { ok: false, message: "Hanya Manager atau Owner yang bisa mengubah data tim" };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update(data)
    .eq("id", orgId);

  if (error) return { ok: false, message: error.message };

  // Audit log
  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "org_updated",
    entityType: "organization",
    entityId: orgId,
    metadata: data,
  });

  revalidatePath("/dashboard/teams");
  revalidatePath("/manage");
  return { ok: true };
}

/**
 * Toggle org public profile visibility. Owner-only.
 */
export async function toggleOrgPublicAction(
  orgId: string,
  isPublic: boolean,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) return { ok: false, message: "Hanya owner" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ is_public: isPublic })
    .eq("id", orgId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/teams");
  return { ok: true };
}

/**
 * Archive a division (set is_active = false). Owner-only.
 */
export async function archiveDivisionAction(
  divisionId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner yang bisa mengarsipkan divisi" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("divisions")
    .update({ is_active: false })
    .eq("id", divisionId);

  if (error) return { ok: false, message: error.message };

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "division_archived",
    entityType: "division",
    entityId: divisionId,
  });

  revalidatePath("/dashboard/teams");
  return { ok: true };
}

/**
 * Permanently delete a division. Owner-only.
 */
export async function deleteDivisionAction(
  divisionId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner yang bisa menghapus divisi" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("divisions")
    .delete()
    .eq("id", divisionId);

  if (error) return { ok: false, message: error.message };

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "division_deleted",
    entityType: "division",
    entityId: divisionId,
  });

  revalidatePath("/dashboard/teams");
  return { ok: true };
}

/**
 * Remove a member from an organization. Owner-only.
 */
export async function removeMemberAction(
  memberId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner yang bisa menghapus member" };
  }

  const admin = createAdminClient();

  // Don't allow removing owner
  const { data: member } = await admin
    .from("team_members")
    .select("role, user_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) return { ok: false, message: "Member tidak ditemukan" };
  if (member.role === "owner") return { ok: false, message: "Tidak bisa menghapus Owner" };

  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("id", memberId);

  if (error) return { ok: false, message: error.message };

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "member_removed",
    entityType: "team_member",
    entityId: memberId,
    metadata: { removed_user_id: member.user_id, role: member.role },
  });

  revalidatePath("/dashboard/users");
  return { ok: true };
}

/**
 * Change a member's role. Owner-only.
 */
export async function changeRoleAction(
  memberId: string,
  newRole: MemberRole,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner yang bisa mengubah role" };
  }

  if (newRole === "owner") return { ok: false, message: "Tidak bisa assign role Owner" };

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("team_members")
    .select("role, user_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) return { ok: false, message: "Member tidak ditemukan" };
  if (member.role === "owner") return { ok: false, message: "Tidak bisa mengubah role Owner" };

  const { error } = await admin
    .from("team_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) return { ok: false, message: error.message };

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "role_changed",
    entityType: "team_member",
    entityId: memberId,
    metadata: { from: member.role, to: newRole, user_id: member.user_id },
  });

  revalidatePath("/dashboard/users");
  return { ok: true };
}


/**
 * Create a standalone division (not tied to a specific org yet).
 * Owner-only. Divisions are reusable across teams.
 */
export async function createDivisionAction(
  name: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  if (!name || name.trim().length < 2) {
    return { ok: false, message: "Nama divisi minimal 2 karakter" };
  }

  // Verify owner by email
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner yang bisa membuat divisi" };
  }

  const admin = createAdminClient();

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check duplicate name (case-insensitive) in standalone divisions
  const { data: existing } = await admin
    .from("divisions")
    .select("id")
    .ilike("name", name.trim())
    .is("organization_id", null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { ok: false, message: "Divisi dengan nama ini sudah ada. Gunakan nama lain." };
  }

  const { error } = await admin
    .from("divisions")
    .insert({
      organization_id: null,
      name: name.trim(),
      slug,
      game: name.trim(),
    });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Divisi dengan nama ini sudah ada" };
    }
    return { ok: false, message: error.message };
  }

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "division_created",
    entityType: "division",
    metadata: { name: name.trim() },
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  return { ok: true };
}


/**
 * Rename a division. Owner-only.
 */
export async function renameDivisionAction(
  divisionId: string,
  newName: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner yang bisa merename divisi" };
  }

  if (!newName || newName.trim().length < 2) {
    return { ok: false, message: "Nama divisi minimal 2 karakter" };
  }

  const admin = createAdminClient();
  const slug = newName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error } = await admin
    .from("divisions")
    .update({ name: newName.trim(), slug })
    .eq("id", divisionId);

  if (error) return { ok: false, message: error.message };

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "division_renamed",
    entityType: "division",
    entityId: divisionId,
    metadata: { newName: newName.trim() },
  });

  revalidatePath("/dashboard/divisions");
  revalidatePath("/dashboard");
  return { ok: true };
}


/**
 * Create a new team and copy selected divisions into it.
 * Creates new division rows in the new org (does not move/steal from other orgs).
 */
export async function createTeamWithDivisionsAction(input: {
  name: string;
  divisionIds: string[];
}): Promise<ActionError | { ok: true; orgId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Verify caller is owner by email
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner yang bisa membuat tim baru" };
  }

  const slug = input.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

  const admin = createAdminClient();

  // Create the org
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({
      name: input.name,
      slug,
      tier: "komunitas",
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (orgErr || !org) {
    if (orgErr?.code === "23505") {
      return { ok: false, message: "Nama tim sudah dipakai (slug duplikat)" };
    }
    return { ok: false, message: orgErr?.message ?? "Gagal membuat tim" };
  }

  // Copy selected divisions to this new org (standalone originals stay untouched)
  let firstDivId: string | null = null;
  if (input.divisionIds.length > 0) {
    const { data: sourceDivs } = await admin
      .from("divisions")
      .select("name, slug, game")
      .in("id", input.divisionIds);

    if (sourceDivs && sourceDivs.length > 0) {
      const newDivRows = sourceDivs.map((d) => ({
        organization_id: org.id,
        name: d.name,
        slug: d.slug,
        game: d.game,
      }));
      const { data: createdDivs } = await admin.from("divisions").insert(newDivRows).select("id");
      if (createdDivs && createdDivs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        firstDivId = (createdDivs[0] as any).id;
      }
    }
  }

  // Add owner as member of this org
  await admin.from("team_members").insert({
    user_id: user.id,
    organization_id: org.id,
    division_id: firstDivId, // Assign to first division if created
    role: "owner",
    is_active: true,
  });

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "team_created",
    entityType: "organization",
    entityId: org.id,
    metadata: { name: input.name, divisionIds: input.divisionIds },
  });

  revalidatePath("/dashboard");
  return { ok: true, orgId: org.id };
}


/**
 * Delete an organization and all its members. Owner-only.
 */
export async function deleteOrgAction(
  orgId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner yang bisa menghapus tim" };
  }

  const admin = createAdminClient();
  // Delete members first (FK constraint)
  await admin.from("team_members").delete().eq("organization_id", orgId);

  // Delete divisions linked to this org
  await admin.from("divisions").delete().eq("organization_id", orgId);

  // Delete org
  const { error } = await admin.from("organizations").delete().eq("id", orgId);

  if (error) return { ok: false, message: error.message };

  const { logAudit } = await import("@/lib/audit");
  await logAudit({ actorId: user.id, action: "org_deleted", entityType: "organization", entityId: orgId });

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Copy a division to an org (create new row, don't move the original).
 */
export async function addDivisionToOrgAction(
  divisionId: string,
  orgId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner" };
  }

  const admin = createAdminClient();

  // Get source division details
  const { data: source } = await admin
    .from("divisions")
    .select("name, slug, game")
    .eq("id", divisionId)
    .maybeSingle();

  if (!source) return { ok: false, message: "Divisi tidak ditemukan" };

  // Check if this org already has a division with the same name
  const { data: existing } = await admin
    .from("divisions")
    .select("id")
    .eq("organization_id", orgId)
    .eq("name", source.name)
    .maybeSingle();

  if (existing) {
    return { ok: false, message: `Divisi "${source.name}" sudah ada di tim ini` };
  }

  // Create a copy in the target org
  const { error } = await admin
    .from("divisions")
    .insert({
      organization_id: orgId,
      name: source.name,
      slug: source.slug,
      game: source.game,
    });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Remove a division from an org (set org_id to null or delete).
 * We'll just delete the division since it can't exist without an org.
 */
export async function removeDivisionFromOrgAction(
  divisionId: string,
  _orgId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya Owner" };
  }

  const admin = createAdminClient();
  // Archive instead of delete (safer)
  const { error } = await admin
    .from("divisions")
    .update({ is_active: false })
    .eq("id", divisionId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}


/**
 * Remove a member from a team. Manager-only (can't remove owner/manager).
 * Deletes the team_members row from the database.
 */
export async function managerRemoveMemberAction(
  memberId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const admin = createAdminClient();

  // Get the member to check role
  const { data: member } = await admin
    .from("team_members")
    .select("role, user_id, organization_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) return { ok: false, message: "Member tidak ditemukan" };

  // Can't remove owner or manager
  if (member.role === "owner" || member.role === "manager") {
    return { ok: false, message: "Tidak bisa menghapus Owner atau Manager" };
  }

  // Verify caller is manager/owner of this org
  const { data: callerMembership } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", member.organization_id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true)
    .maybeSingle();

  // Also allow if caller is the OWNER_EMAIL
  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwnerByEmail = ownerEmail && user.email === ownerEmail;

  if (!callerMembership && !isOwnerByEmail) {
    return { ok: false, message: "Anda tidak punya akses untuk menghapus member ini" };
  }

  // Delete from database
  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("id", memberId);

  if (error) return { ok: false, message: error.message };

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    actorId: user.id,
    action: "member_removed",
    entityType: "team_member",
    entityId: memberId,
    metadata: { removed_user_id: member.user_id, role: member.role },
  });

  revalidatePath("/manage");
  return { ok: true };
}
