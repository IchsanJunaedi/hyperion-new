"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HERO_CLASSES } from "@/features/scrim/data/mlbb-heroes";
import { logAudit } from "@/lib/audit";
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

async function getManagerRole(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isManagerPlus: false };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email === ownerEmail) return { user, isManagerPlus: true };

  const { data: tm } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .maybeSingle();

  const isManagerPlus = ["manager", "owner"].includes(tm?.role ?? "");
  return { user, isManagerPlus };
}

export async function createMetaPatchAction(
  orgSlug: string,
  orgId: string,
  patchVersion: string,
  season?: string,
  notes?: string,
): Promise<(ActionResult & { id?: string })> {
  const { user, isManagerPlus } = await getManagerRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isManagerPlus) return { ok: false, message: "Hanya Owner/Manager yang bisa membuat patch" };
 
  const trimmedPatch = patchVersion.trim();
  const trimmedSeason = (season || "Season 41").trim();
  if (!trimmedPatch) return { ok: false, message: "Versi patch tidak boleh kosong" };

  const admin = createAdminClient();

  // 1. Deactivate all existing patches for this organization
  const { error: deactivateError } = await admin
    .from("meta_patches")
    .update({ is_active: false })
    .eq("organization_id", orgId);

  if (deactivateError) return { ok: false, message: deactivateError.message };

  // 2. Insert new patch as active
  const { data, error } = await admin
    .from("meta_patches")
    .insert({
      organization_id: orgId,
      patch_version: trimmedPatch,
      season: trimmedSeason,
      notes: notes?.trim() || null,
      is_active: true,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, message: `Patch ${trimmedPatch} sudah ada` };
    return { ok: false, message: error.message };
  }

  // 3. Log Audit
  await logAudit({
    actorId: user.id,
    action: "create",
    entityType: "meta_patches",
    entityId: data.id,
    metadata: { patch_version: trimmedPatch, season: trimmedSeason },
  });

  revalidatePath(`/${orgSlug}/patch`);
  revalidatePath(`/${orgSlug}/meta`);
  revalidatePath(`/${orgSlug}/analytics`);
  return { ok: true, id: data.id };
}

export async function activatePatchAction(
  orgSlug: string,
  orgId: string,
  patchId: string,
): Promise<ActionResult> {
  const { user, isManagerPlus } = await getManagerRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isManagerPlus) return { ok: false, message: "Hanya Owner/Manager yang bisa mengaktifkan patch" };

  const admin = createAdminClient();

  // 1. Deactivate all existing patches for this organization
  const { error: deactivateError } = await admin
    .from("meta_patches")
    .update({ is_active: false })
    .eq("organization_id", orgId);

  if (deactivateError) return { ok: false, message: deactivateError.message };

  // 2. Activate the selected patch
  const { error } = await admin
    .from("meta_patches")
    .update({ is_active: true })
    .eq("id", patchId);

  if (error) return { ok: false, message: error.message };

  // 3. Log Audit
  await logAudit({
    actorId: user.id,
    action: "activate",
    entityType: "meta_patches",
    entityId: patchId,
  });

  revalidatePath(`/${orgSlug}/patch`);
  revalidatePath(`/${orgSlug}/meta`);
  revalidatePath(`/${orgSlug}/analytics`);
  return { ok: true };
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
        hero_class: HERO_CLASSES[hero.hero_name] ?? null,
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
  const { user, isManagerPlus } = await getManagerRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isManagerPlus) return { ok: false, message: "Hanya Owner/Manager yang bisa menghapus patch" };

  const admin = createAdminClient();
  const { error } = await admin.from("meta_patches").delete().eq("id", patchId);
  if (error) return { ok: false, message: error.message };

  // Log Audit
  await logAudit({
    actorId: user.id,
    action: "delete",
    entityType: "meta_patches",
    entityId: patchId,
  });

  revalidatePath(`/${orgSlug}/patch`);
  revalidatePath(`/${orgSlug}/meta`);
  revalidatePath(`/${orgSlug}/analytics`);
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
 
export async function updateMetaPatchAction(
  orgSlug: string,
  orgId: string,
  patchId: string,
  patchVersion: string,
  season: string,
  notes?: string,
): Promise<ActionResult> {
  const { user, isManagerPlus } = await getManagerRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isManagerPlus) return { ok: false, message: "Hanya Owner/Manager yang bisa mengedit patch" };
 
  const trimmedPatch = patchVersion.trim();
  const trimmedSeason = season.trim();
  if (!trimmedPatch) return { ok: false, message: "Versi patch tidak boleh kosong" };
  if (!trimmedSeason) return { ok: false, message: "Season tidak boleh kosong" };
 
  const admin = createAdminClient();
 
  const { error } = await admin
    .from("meta_patches")
    .update({
      patch_version: trimmedPatch,
      season: trimmedSeason,
      notes: notes?.trim() || null,
      created_at: new Date().toISOString(),
    })
    .eq("id", patchId)
    .eq("organization_id", orgId);
 
  if (error) {
    if (error.code === "23505") return { ok: false, message: `Patch ${trimmedPatch} sudah ada` };
    return { ok: false, message: error.message };
  }
 
  await logAudit({
    actorId: user.id,
    action: "patch.update",
    entityType: "meta_patches",
    entityId: patchId,
    metadata: { patchVersion: trimmedPatch, season: trimmedSeason },
  });
 
  revalidatePath(`/${orgSlug}/patch`);
  revalidatePath(`/${orgSlug}/meta`);
  revalidatePath(`/${orgSlug}/analytics`);
  return { ok: true };
}
