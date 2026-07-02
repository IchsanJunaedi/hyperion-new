"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import type { Database } from "@/types/database";

export interface SignInResult {
  error?: string;
}

const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

type RateLimitRow = {
  attempts: number;
  locked_until: string | null;
};
type RateLimitInsert = Database["public"]["Tables"]["login_rate_limits"]["Insert"];

async function getRateLimit(email: string): Promise<RateLimitRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("login_rate_limits")
    .select("attempts, locked_until")
    .eq("identifier", email)
    .maybeSingle();
  return data ?? null;
}

async function recordFailedAttempt(email: string, current: RateLimitRow | null): Promise<void> {
  const admin = createAdminClient();
  const now = new Date();

  // Only reset window if a lock previously existed AND has now expired
  const lockExpired =
    current?.locked_until != null && new Date(current.locked_until) <= now;
  const prevAttempts = lockExpired ? 0 : (current?.attempts ?? 0);
  const newAttempts = prevAttempts + 1;
  const lockedUntil =
    newAttempts >= MAX_ATTEMPTS
      ? new Date(now.getTime() + LOCK_DURATION_MS).toISOString()
      : null;

  await admin.from("login_rate_limits").upsert({
    identifier: email,
    attempts: newAttempts,
    locked_until: lockedUntil,
    updated_at: now.toISOString(),
  } as RateLimitInsert);
}

async function clearRateLimit(email: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("login_rate_limits")
    .delete()
    .eq("identifier", email);
}

export async function signInAction(
  input: LoginInput & { next?: string },
): Promise<SignInResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Input tidak valid" };
  }

  const email = parsed.data.email;

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

  // 2. Attempt login
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    // Record failed attempt (fire-and-forget, don't block response)
    await recordFailedAttempt(email, rateLimit);

    // Audit log the failed login attempt
    logAudit({
      actorId: null as unknown as string, // unknown — not authenticated yet
      action: "login.failed",
      entityType: "auth",
      metadata: { email, reason: error.message },
    });

    // Check if this attempt just triggered a lock
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
    if (
      error.message.toLowerCase().includes("invalid login") ||
      error.message.toLowerCase().includes("email not confirmed")
    ) {
      return {
        error: `Email atau password salah. Sisa percobaan: ${remaining}.`,
      };
    }
    return { error: error.message };
  }

  // 3. Success — clear rate limit record
  await clearRateLimit(email);

  const cookieStore = await cookies();
  cookieStore.set("last_activity", String(Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  // If explicit next param, honor it
  const next = sanitizeNext(input.next);
  if (next !== "/") {
    redirect(next);
  }

  // Auto-redirect based on role (DB query, not JWT)
  const userId = authData.user?.id;
  const userEmail = authData.user?.email;
  if (userId) {
    const dest = await getRedirectForUser(supabase, userId, userEmail);
    redirect(dest);
  }

  redirect("/");
}

async function getRedirectForUser(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  userEmail: string | undefined,
): Promise<string> {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (ownerEmail && userEmail === ownerEmail) {
    return "/dashboard";
  }

  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, organization_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("role", { ascending: true });

  if (!memberships || memberships.length === 0) {
    return "/";
  }

  const roles = memberships.map((m) => m.role);

  if (roles.includes("manager")) {
    return "/manage";
  }

  const firstMembership = memberships[0];
  if (firstMembership) {
    const { data: org } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", firstMembership.organization_id)
      .maybeSingle();
    if (org?.slug) {
      return `/${org.slug}`;
    }
  }

  return "/";
}

function sanitizeNext(next: string | undefined): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
