"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/database";

export interface RosterActionError {
  ok: false;
  message: string;
}

export async function updateRoleAction(
  orgSlug: string,
  memberId: string,
  role: MemberRole,
): Promise<RosterActionError | { ok: true }> {
  if (role === "owner") {
    return { ok: false, message: "Role owner tidak bisa diassign manual" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("team_members")
    .update({ role })
    .eq("id", memberId);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa mengubah role"
          : error.message,
    };
  }

  revalidatePath(`/${orgSlug}/roster`);
  return { ok: true };
}
