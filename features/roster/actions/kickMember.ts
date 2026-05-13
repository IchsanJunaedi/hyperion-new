"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface RosterActionError {
  ok: false;
  message: string;
}

/**
 * Remove a member from the org. RLS allows: owner deletes anyone;
 * any user can delete their own row (self-leave).
 */
export async function kickMemberAction(
  orgSlug: string,
  memberId: string,
): Promise<RosterActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya owner yang bisa mengeluarkan member"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/roster`);
  return { ok: true };
}
