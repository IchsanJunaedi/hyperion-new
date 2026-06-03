import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type GalleryEntry = Database["public"]["Tables"]["gallery_entries"]["Row"];
export type Partner = Database["public"]["Tables"]["partners"]["Row"];
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type DivisionPublic = Database["public"]["Tables"]["divisions_public"]["Row"];
export type SiteSetting = Database["public"]["Tables"]["site_settings"]["Row"];
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];

export type DivisionMember = {
  user_id: string;
  role: string;
  position: string | null;
  jersey_number: number | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type DivisionWithMembers = {
  id: string;
  name: string;
  game: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_public: boolean;
  members: DivisionMember[];
};

export async function getDivisionsWithMembers(): Promise<DivisionWithMembers[]> {
  const admin = createAdminClient();

  const { data: divisions, error: divErr } = await admin
    .from("divisions")
    .select("id, name, game, description, logo_url, is_active, is_public")
    .order("name")
    .limit(50);
  if (divErr) console.error("getDivisionsWithMembers divisions:", divErr);
  if (!divisions || divisions.length === 0) return [];

  const divisionIds = divisions.map((d) => d.id);

  const { data: members, error: memErr } = await admin
    .from("team_members")
    .select("user_id, role, position, jersey_number, division_id")
    .in("division_id", divisionIds)
    .in("role", ["captain", "member", "coach"])
    .eq("is_active", true)
    .limit(500);
  if (memErr) console.error("getDivisionsWithMembers members:", memErr);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles, error: profErr } = await admin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds)
      .limit(500);
    if (profErr) console.error("getDivisionsWithMembers profiles:", profErr);
    profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  }

  return divisions.map((div) => {
    const divMembers = (members ?? [])
      .filter((m) => m.division_id === div.id)
      .map((m) => {
        const profile = profileMap.get(m.user_id);
        return {
          user_id: m.user_id,
          role: m.role,
          position: m.position,
          jersey_number: m.jersey_number,
          display_name: profile?.display_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        };
      });
    return { ...div, members: divMembers };
  });
}

export async function getGalleryEntries(): Promise<GalleryEntry[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gallery_entries")
    .select("*")
    .order("sort_order")
    .limit(50);
  if (error) console.error("getGalleryEntries:", error);
  return data ?? [];
}

export async function getGalleryEntryBySlug(slug: string): Promise<GalleryEntry | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gallery_entries")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) console.error("getGalleryEntryBySlug:", error);
  return data ?? null;
}

export async function getPartners(): Promise<Partner[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("partners")
    .select("*")
    .order("sort_order")
    .limit(50);
  if (error) console.error("getPartners:", error);
  return data ?? [];
}

export async function getActivePartners(): Promise<Partner[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("partners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(50);
  if (error) console.error("getActivePartners:", error);
  return data ?? [];
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonials")
    .select("*")
    .order("sort_order")
    .limit(50);
  if (error) console.error("getTestimonials:", error);
  return data ?? [];
}

export async function getActiveTestimonials(): Promise<Testimonial[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(50);
  if (error) console.error("getActiveTestimonials:", error);
  return data ?? [];
}

export async function getDivisionsPublic(): Promise<DivisionPublic[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("divisions_public")
    .select("*")
    .order("sort_order")
    .limit(50);
  if (error) console.error("getDivisionsPublic:", error);
  return data ?? [];
}

export async function getActiveDivisionsPublic(): Promise<DivisionPublic[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("divisions_public")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(50);
  if (error) console.error("getActiveDivisionsPublic:", error);
  return data ?? [];
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("key, value")
    .limit(100);
  if (error) console.error("getSiteSettings:", error);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return map;
}

export async function getAchievements(): Promise<Achievement[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("achievements")
    .select("id, title, description, placement, achieved_at, image_url, organization_id, division_id, tournament_id, created_at")
    .order("achieved_at", { ascending: false })
    .limit(50);
  if (error) console.error("getAchievements:", error);
  return data ?? [];
}

export const getPublicAchievements = getAchievements;
