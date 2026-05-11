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

  const cleanGameIds = stripEmpty(parsed.data.game_ids);

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
    return { error: "Username sudah dipakai. Coba yang lain." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      bio: parsed.data.bio ? parsed.data.bio : null,
      game_ids: cleanGameIds,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Username sudah dipakai. Coba yang lain." };
    }
    return { error: error.message };
  }

  redirect("/onboarding/organization");
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
