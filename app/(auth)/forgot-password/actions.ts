"use server";

import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

export interface ForgotPasswordResult {
  ok: boolean;
  message?: string;
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${appUrl}/auth/callback?next=/reset-password`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
