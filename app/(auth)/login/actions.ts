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
  const { data: authData, error } = await supabase.auth.signInWithPassword({
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
  // Check if owner by email
  const ownerEmail = process.env.OWNER_EMAIL;
  if (ownerEmail && userEmail === ownerEmail) {
    return "/dashboard";
  }

  // Get highest role membership
  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, organization_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("role", { ascending: true });

  if (!memberships || memberships.length === 0) {
    return "/"; // No membership yet, show landing
  }

  const roles = memberships.map((m) => m.role);

  if (roles.includes("manager")) {
    return "/manage";
  }

  // Coach, Captain, Member → go to workspace
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
