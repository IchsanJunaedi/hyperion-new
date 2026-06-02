import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type GalleryEntry = Database["public"]["Tables"]["gallery_entries"]["Row"];
export type Partner = Database["public"]["Tables"]["partners"]["Row"];
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type DivisionPublic = Database["public"]["Tables"]["divisions_public"]["Row"];
export type SiteSetting = Database["public"]["Tables"]["site_settings"]["Row"];

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
