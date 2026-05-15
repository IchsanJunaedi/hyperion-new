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

  // Check username uniqueness
  const dupCheck = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .neq("id", user.id)
    .maybeSingle();

  if (dupCheck.error) {
    return { error: dupCheck.error.message };
  }
  if (dupCheck.data) {
    return { error: "Nickname sudah dipakai. Coba yang lain." };
  }

  const cleanGameIds = stripEmpty(parsed.data.game_ids ?? {});
  const cleanSocialLinks = stripEmpty(parsed.data.social_links ?? {});

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      username: parsed.data.username,
      display_name: parsed.data.username, // Use nickname as display name
      phone_wa: parsed.data.phone_wa,
      date_of_birth: parsed.data.date_of_birth,
      bio: parsed.data.bio ? parsed.data.bio : null,
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
