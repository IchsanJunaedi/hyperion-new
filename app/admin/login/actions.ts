"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface AdminSignInResult {
  error?: string;
}

export async function adminSignInAction(formData: FormData): Promise<AdminSignInResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email dan password wajib diisi" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login")) {
      return { error: "Email atau password salah" };
    }
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.set("last_activity", String(Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  const ownerEmail = process.env.OWNER_EMAIL;
  const userEmail = data.user?.email;

  if (userEmail !== adminEmail && userEmail !== ownerEmail) {
    await supabase.auth.signOut();
    cookieStore.delete("last_activity");
    return { error: "Akses ditolak. Akun ini tidak memiliki akses admin." };
  }

  redirect("/admin");
}
