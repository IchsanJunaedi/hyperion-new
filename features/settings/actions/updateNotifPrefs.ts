"use server";

import { createClient } from "@/lib/supabase/server";

export interface NotifPref {
  event_type: string;
  wa_enabled: boolean;
}

export async function updateNotifPrefsAction(
  orgId: string,
  prefs: NotifPref[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const rows = prefs.map((p) => ({
    user_id: user.id,
    org_id: orgId,
    event_type: p.event_type,
    wa_enabled: p.wa_enabled,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("notification_preferences")
    .upsert(rows, { onConflict: "user_id,org_id,event_type" });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
