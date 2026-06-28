"use server";

import { encrypt } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";

export interface UpdateProfileData {
  display_name?: string;
  username?: string;
  full_name?: string;
  bio?: string;
  phone_wa?: string;
  date_of_birth?: string | null;
  avatar_url?: string | null;
}

export async function updateProfileAction(
  data: UpdateProfileData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const updatePayload: Record<string, unknown> = { ...data };

  // Encrypt bio if provided
  if (data.bio !== undefined) {
    try {
      updatePayload.encrypted_bio = encrypt(data.bio);
    } catch {
      // If ENCRYPTION_KEY not set, skip encryption silently
      console.warn("[updateProfile] ENCRYPTION_KEY not set, skipping encryption");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("profiles").update(updatePayload as any).eq("id", user.id);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
