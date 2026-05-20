"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type MainRole = "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;

const VALID_MAIN_ROLES = new Set(["exp_lane", "jungler", "mid_lane", "gold_lane", "roamer"]);

export async function updateMainRoleAction(
  orgSlug: string,
  memberId: string,
  mainRole: MainRole,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Tidak terautentikasi" };

  if (mainRole !== null && !VALID_MAIN_ROLES.has(mainRole)) {
    return { ok: false, message: "Role ingame tidak valid" };
  }

  const admin = createAdminClient();

  const { data: target } = await admin
    .from("team_members")
    .select("role, organization_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!target) return { ok: false, message: "Member tidak ditemukan" };

  // main_role hanya untuk captain dan member (yang main game)
  if (!["captain", "member"].includes(target.role)) {
    return { ok: false, message: "Role ingame hanya berlaku untuk captain dan member" };
  }

  // Cek akses: owner (via env), manager, atau coach dalam org yang sama
  const isOwner = user.email === process.env.OWNER_EMAIL;
  if (!isOwner) {
    const { data: caller } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", target.organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!caller || !["owner", "manager", "coach"].includes(caller.role)) {
      return { ok: false, message: "Tidak punya akses untuk mengubah role ingame" };
    }
  }

  const { error } = await admin
    .from("team_members")
    .update({ main_role: mainRole })
    .eq("id", memberId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/roster`);
  revalidatePath("/manage");
  return { ok: true };
}
