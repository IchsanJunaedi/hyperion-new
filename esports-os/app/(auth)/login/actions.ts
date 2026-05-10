"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export interface SignInResult {
  error?: string;
}

export async function signInAction(
  input: LoginInput & { next?: string },
): Promise<SignInResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Input tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login")) {
      return { error: "Email atau password salah." };
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "Email belum dikonfirmasi. Cek inbox kamu untuk link aktivasi.",
      };
    }
    return { error: error.message };
  }

  const next = sanitizeNext(input.next);
  redirect(next);
}

function sanitizeNext(next: string | undefined): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
