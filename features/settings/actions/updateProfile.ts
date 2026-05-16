"use server";

import { createClient } from "@/lib/supabase/server";

export interface UpdateProfileData {
  display_name?: string;
  username?: string;
  full_name?: string;
  bio?: string;
  phone_wa?: string;
  date_of_birth?: string | null;
  avatar_url?: string | null;
  game_ids?: Record<string, string>;
  social_links?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    discord?: string;
  };
}

export async function updateProfileAction(
  data: UpdateProfileData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const { error } = await supabase.from("profiles").update(data).eq("id", user.id);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
