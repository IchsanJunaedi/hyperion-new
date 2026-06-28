"use server";

import { redirect } from "next/navigation";

import { encrypt } from "@/lib/encryption";
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

  // Fetch existing profile to preserve display_name casing/spaces
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const finalDisplayName = existingProfile?.display_name && !existingProfile.display_name.includes("@")
    ? existingProfile.display_name
    : parsed.data.full_name;

  const cleanGameIds = stripEmpty(parsed.data.game_ids ?? {});
  const cleanSocialLinks = stripEmpty(parsed.data.social_links ?? {});

  // Encrypt PII fields before saving
  let encryptedGameIds: string | undefined;
  let encryptedSocialLinks: string | undefined;
  try {
    encryptedGameIds = encrypt(JSON.stringify(cleanGameIds));
    encryptedSocialLinks = encrypt(JSON.stringify(cleanSocialLinks));
  } catch {
    console.warn("[saveProfile] ENCRYPTION_KEY not set, skipping encryption");
  }

  const updatePayload: Record<string, unknown> = {
    full_name: parsed.data.full_name,
    username: username,
    display_name: finalDisplayName,
    phone_wa: parsed.data.phone_wa,
    date_of_birth: parsed.data.date_of_birth,
    social_links: cleanSocialLinks,
    game_ids: cleanGameIds,
  };
  if (encryptedGameIds !== undefined) updatePayload.encrypted_game_ids = encryptedGameIds;
  if (encryptedSocialLinks !== undefined) updatePayload.encrypted_social_links = encryptedSocialLinks;

  const { error } = await supabase
    .from("profiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updatePayload as any)
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
