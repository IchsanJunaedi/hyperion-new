import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MetaPatch = Database["public"]["Tables"]["meta_patches"]["Row"];
export type MetaHeroRating = Database["public"]["Tables"]["meta_hero_ratings"]["Row"];

export interface PatchWithHeroes extends MetaPatch {
  heroes: MetaHeroRating[];
}

const META_PATCH_COLS =
  "id, organization_id, patch_version, notes, tier_descriptions, created_by, created_at, updated_at";

const META_HERO_COLS =
  "id, patch_id, hero_name, hero_class, role_tag, tier, is_ban_priority, priority_to_learn, counters, synergies, draft_notes, notes, created_at, updated_at";

export async function getMetaPatches(orgId: string): Promise<MetaPatch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meta_patches")
    .select(META_PATCH_COLS)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPatchWithHeroes(patchId: string): Promise<PatchWithHeroes | null> {
  const supabase = await createClient();
  const { data: patch } = await supabase
    .from("meta_patches")
    .select(META_PATCH_COLS)
    .eq("id", patchId)
    .maybeSingle();
  if (!patch) return null;

  const { data: heroes } = await supabase
    .from("meta_hero_ratings")
    .select(META_HERO_COLS)
    .eq("patch_id", patchId)
    .order("tier")
    .order("hero_name");

  return { ...patch, heroes: heroes ?? [] };
}

export async function getPreviousPatchHeroes(
  orgId: string,
  currentPatchId: string,
): Promise<MetaHeroRating[]> {
  const supabase = await createClient();
  const { data: patch } = await supabase
    .from("meta_patches")
    .select("id")
    .eq("organization_id", orgId)
    .neq("id", currentPatchId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!patch) return [];
  const { data: heroes } = await supabase
    .from("meta_hero_ratings")
    .select(META_HERO_COLS)
    .eq("patch_id", patch.id);
  return heroes ?? [];
}

export async function getLatestPatchWithHeroes(orgId: string): Promise<PatchWithHeroes | null> {
  const supabase = await createClient();
  const { data: patch } = await supabase
    .from("meta_patches")
    .select(META_PATCH_COLS)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!patch) return null;

  const { data: heroes } = await supabase
    .from("meta_hero_ratings")
    .select(META_HERO_COLS)
    .eq("patch_id", patch.id)
    .order("tier")
    .order("hero_name");

  return { ...patch, heroes: heroes ?? [] };
}
