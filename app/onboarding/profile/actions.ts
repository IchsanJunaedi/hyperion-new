"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  profileSetupSchema,
  type ProfileSetupInput,
} from "@/lib/validations/onboarding";

export interface SaveProfileResult {
  error?: string;
}

export async function saveProfileAction(
  input: ProfileSetupInput,
): Promise<SaveProfileResult> {
  const parsed = profileSetupSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Input tidak valid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Silakan masuk lagi." };

  // Check phone_wa uniqueness
  const phoneCheck = await supabase
    .from("profiles")
    .select("id")
    .eq("phone_wa", parsed.data.phone_wa)
    .neq("id", user.id)
    .limit(1);

  if (phoneCheck.error) {
    return { error: phoneCheck.error.message };
  }
  if (phoneCheck.data && phoneCheck.data.length > 0) {
    return { error: "Nomor WhatsApp ini sudah terdaftar. Gunakan nomor lain." };
  }

  // Check username uniqueness and automatically resolve duplicates
  let username = parsed.data.username;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const dupCheck = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();

    if (dupCheck.error) {
      return { error: dupCheck.error.message };
    }
    if (!dupCheck.data) {
      isUnique = true;
    } else {
      attempts++;
      const suffix = Math.floor(10 + Math.random() * 90).toString(); // 2-digit random number
      username = parsed.data.username.slice(0, 24 - suffix.length - 1) + "_" + suffix;
    }
  }

  const cleanGameIds = stripEmpty(parsed.data.game_ids ?? {});
  const cleanSocialLinks = stripEmpty(parsed.data.social_links ?? {});

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      username: username,
      display_name: username,
      phone_wa: parsed.data.phone_wa,
      date_of_birth: parsed.data.date_of_birth,
      social_links: cleanSocialLinks,
      game_ids: cleanGameIds,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Nickname sudah dipakai. Coba yang lain." };
    }
    return { error: error.message };
  }

  // After profile setup, redirect to home. Owner/Manager will see
  // their dashboard; regular members wait to be assigned to a team.
  redirect("/");
}

function stripEmpty(
  obj: Record<string, string | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.trim().length > 0) {
      out[key] = value.trim();
    }
  }
  return out;
}
