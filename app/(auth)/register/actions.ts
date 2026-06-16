"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export interface SignUpResult {
  error?: string;
  needsEmailConfirmation?: boolean;
}

const REGISTRATION_MAX_ATTEMPTS = 3;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRegisterRateLimit(email: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";

    const admin = createAdminClient();
    const now = new Date();

    const identifiers = [`register:email:${email}`, `register:ip:${ip}`];

    for (const identifier of identifiers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (admin as any)
        .from("login_rate_limits")
        .select("attempts, locked_until")
        .eq("identifier", identifier)
        .maybeSingle();

      if (data?.locked_until && new Date(data.locked_until) > now) {
        const minutesLeft = Math.ceil((new Date(data.locked_until).getTime() - now.getTime()) / 60_000);
        return {
          allowed: false,
          message: `Terlalu banyak pendaftaran. Coba lagi dalam ${minutesLeft} menit.`,
        };
      }

      const lockExpired = !data?.locked_until || new Date(data.locked_until) <= now;
      const prevAttempts = lockExpired ? 0 : (data?.attempts ?? 0);
      const newAttempts = prevAttempts + 1;
      const lockedUntil = newAttempts >= REGISTRATION_MAX_ATTEMPTS
        ? new Date(now.getTime() + REGISTRATION_WINDOW_MS).toISOString()
        : null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("login_rate_limits").upsert({
        identifier,
        attempts: newAttempts,
        locked_until: lockedUntil,
        updated_at: now.toISOString(),
      });
    }
  } catch (err) {
    console.error("Register rate limit check error:", err);
  }

  return { allowed: true };
}

export async function signUpAction(
  input: RegisterInput & { next?: string },
): Promise<SignUpResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Input tidak valid" };
  }

  // Rate Limit check
  const rateLimit = await checkRegisterRateLimit(parsed.data.email);
  if (!rateLimit.allowed) {
    return { error: rateLimit.message ?? "Terlalu banyak pendaftaran." };
  }

  // Check if phone_wa is already registered
  const admin = createAdminClient();
  const { data: phoneCheck, error: phoneErr } = await admin
    .from("profiles")
    .select("id")
    .eq("phone_wa", parsed.data.phone_wa)
    .limit(1)
    .maybeSingle();

  if (phoneErr) {
    console.error("signUpAction phone check error:", phoneErr);
  }
  if (phoneCheck) {
    return { error: "Nomor WhatsApp ini sudah terdaftar. Gunakan nomor lain." };
  }

  // Block public registration of privileged system emails (owner / admin).
  // These accounts must be created via Supabase dashboard or Google OAuth
  // using the actual email inbox — prevents race-condition account squatting
  // when mailer_autoconfirm is enabled.
  const emailLower = parsed.data.email.toLowerCase();
  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (
    (ownerEmail && emailLower === ownerEmail) ||
    (adminEmail && emailLower === adminEmail)
  ) {
    return { error: "Email ini tidak tersedia untuk pendaftaran publik." };
  }

  const supabase = await createClient();
  const next = sanitizeNext(input.next) ?? "/onboarding/profile";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.display_name,
        phone_wa: parsed.data.phone_wa,
      },
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists")
    ) {
      return {
        error: "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.",
      };
    }
    return { error: error.message };
  }

  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  // Audit Log: User Registered
  const { logAudit } = await import("@/lib/audit");
  if (data.user) {
    await logAudit({
      actorId: data.user.id,
      action: "user_registered",
      entityType: "profile",
      entityId: data.user.id,
      metadata: {
        email: parsed.data.email,
        displayName: parsed.data.display_name,
      },
    });
  }

  redirect(next);
}

function sanitizeNext(next: string | undefined): string | undefined {
  if (!next) return undefined;
  if (!next.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}
