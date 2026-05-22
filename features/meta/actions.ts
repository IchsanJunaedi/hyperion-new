"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MetaHeroRating } from "./queries";

type ActionResult = { ok: true } | { ok: false; message: string };

async function getCoachRole(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isCoachPlus: false };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email === ownerEmail) return { user, isCoachPlus: true };

  const { data: tm } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .maybeSingle();

  const isCoachPlus = ["coach", "manager", "owner"].includes(tm?.role ?? "");
  return { user, isCoachPlus };
}

export async function createMetaPatchAction(
  orgSlug: string,
  orgId: string,
  patchVersion: string,
  notes: string,
): Promise<(ActionResult & { id?: string })> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa membuat patch" };

  const trimmed = patchVersion.trim();
  if (!trimmed) return { ok: false, message: "Versi patch tidak boleh kosong" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("meta_patches")
    .insert({ organization_id: orgId, patch_version: trimmed, notes: notes.trim() || null, created_by: user.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, message: `Patch ${trimmed} sudah ada` };
    return { ok: false, message: error.message };
  }

  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true, id: data.id };
}

export async function upsertHeroRatingAction(
  orgSlug: string,
  orgId: string,
  patchId: string,
  hero: {
    hero_name: string;
    tier: "SS" | "S" | "A" | "B" | "C" | "D";
    role_tag: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;
    is_ban_priority: boolean;
    priority_to_learn: boolean;
    notes: string;
    draft_notes: string;
    counters: string[];
    synergies: string[];
  },
): Promise<{ ok: true; hero: MetaHeroRating } | { ok: false; message: string }> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa mengedit meta" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("meta_hero_ratings")
    .upsert(
      {
        patch_id: patchId,
        hero_name: hero.hero_name,
        tier: hero.tier,
        role_tag: hero.role_tag,
        is_ban_priority: hero.is_ban_priority,
        priority_to_learn: hero.priority_to_learn,
        notes: hero.notes.trim() || null,
        draft_notes: hero.draft_notes.trim() || null,
        counters: hero.counters,
        synergies: hero.synergies,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "patch_id,hero_name" },
    )
    .select()
    .single();

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true, hero: data };
}

export async function deleteHeroRatingAction(
  orgSlug: string,
  orgId: string,
  ratingId: string,
): Promise<ActionResult> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa menghapus" };

  const admin = createAdminClient();
  const { error } = await admin.from("meta_hero_ratings").delete().eq("id", ratingId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true };
}

export async function deleteMetaPatchAction(
  orgSlug: string,
  orgId: string,
  patchId: string,
): Promise<ActionResult> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa menghapus patch" };

  const admin = createAdminClient();
  const { error } = await admin.from("meta_patches").delete().eq("id", patchId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true };
}

export async function updatePatchSettingsAction(
  orgSlug: string,
  orgId: string,
  patchId: string,
  notes: string,
  tierDescriptions: Record<string, string>,
): Promise<ActionResult> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa mengedit meta" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("meta_patches")
    .update({
      notes: notes.trim() || null,
      tier_descriptions: Object.keys(tierDescriptions).length > 0 ? tierDescriptions : null,
    })
    .eq("id", patchId);

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true };
}
