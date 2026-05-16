"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UpdateOrgData {
  name?: string;
  logo_url?: string | null;
}

export async function updateOrgAction(
  orgId: string,
  data: UpdateOrgData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return { ok: false, message: "Hanya owner yang bisa mengubah data organisasi." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("organizations").update(data).eq("id", orgId);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
