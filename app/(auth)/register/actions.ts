"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export interface SignUpResult {
  error?: string;
  needsEmailConfirmation?: boolean;
}

export async function signUpAction(
  input: RegisterInput & { next?: string },
): Promise<SignUpResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Input tidak valid" };
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

  redirect(next);
}

function sanitizeNext(next: string | undefined): string | undefined {
  if (!next) return undefined;
  if (!next.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}
