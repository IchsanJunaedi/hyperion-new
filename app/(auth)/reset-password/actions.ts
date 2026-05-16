"use server";

import { createClient } from "@/lib/supabase/server";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

export interface ResetPasswordResult {
  ok: boolean;
  message?: string;
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
