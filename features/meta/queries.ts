import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MetaPatch = Database["public"]["Tables"]["meta_patches"]["Row"];
export type MetaHeroRating = Database["public"]["Tables"]["meta_hero_ratings"]["Row"];

export interface PatchWithHeroes extends MetaPatch {
  heroes: MetaHeroRating[];
}

export async function getMetaPatches(orgId: string): Promise<MetaPatch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meta_patches")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPatchWithHeroes(patchId: string): Promise<PatchWithHeroes | null> {
  const supabase = await createClient();
  const { data: patch } = await supabase
    .from("meta_patches")
    .select("*")
    .eq("id", patchId)
    .maybeSingle();
  if (!patch) return null;

  const { data: heroes } = await supabase
    .from("meta_hero_ratings")
    .select("*")
    .eq("patch_id", patchId)
    .order("tier")
    .order("hero_name");

  return { ...patch, heroes: heroes ?? [] };
}

export async function getLatestPatchWithHeroes(orgId: string): Promise<PatchWithHeroes | null> {
  const supabase = await createClient();
  const { data: patch } = await supabase
    .from("meta_patches")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!patch) return null;

  const { data: heroes } = await supabase
    .from("meta_hero_ratings")
    .select("*")
    .eq("patch_id", patch.id)
    .order("tier")
    .order("hero_name");

  return { ...patch, heroes: heroes ?? [] };
}
