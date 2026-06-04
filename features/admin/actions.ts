"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { ok: true } | { ok: false; message: string };

async function verifyAdminAccess(): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: "Tidak terautentikasi" };
  const adminEmail = process.env.ADMIN_EMAIL;
  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== adminEmail && user.email !== ownerEmail) {
    return { ok: false, message: "Akses ditolak" };
  }
  return { ok: true };
}

// ── Gallery ──────────────────────────────────────────────────────────────────

export async function createGalleryEntry(data: {
  slug: string;
  title: string;
  division: string;
  tournament_date: string;
  position: string;
  status: string;
  logo_url: string | null;
  preview_images: string[];
  description: string;
  sort_order: number;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("gallery_entries").insert(data);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  return { ok: true };
}

export async function updateGalleryEntry(id: string, data: {
  slug?: string;
  title?: string;
  division?: string;
  tournament_date?: string;
  position?: string;
  status?: string;
  logo_url?: string | null;
  preview_images?: string[];
  description?: string;
  sort_order?: number;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("gallery_entries")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  return { ok: true };
}

export async function deleteGalleryEntry(id: string): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("gallery_entries").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
  return { ok: true };
}

// ── Partners ─────────────────────────────────────────────────────────────────

export async function createPartner(data: {
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("partners").insert(data);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/partners");
  return { ok: true };
}

export async function updatePartner(id: string, data: {
  name?: string;
  logo_url?: string | null;
  website_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("partners").update(data).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/partners");
  return { ok: true };
}

export async function deletePartner(id: string): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("partners").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/partners");
  return { ok: true };
}

// ── Testimonials ──────────────────────────────────────────────────────────────

export async function createTestimonial(data: {
  author_name: string;
  author_role: string;
  content: string;
  avatar_url: string | null;
  sort_order: number;
  is_active: boolean;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").insert(data);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return { ok: true };
}

export async function updateTestimonial(id: string, data: {
  author_name?: string;
  author_role?: string;
  content?: string;
  avatar_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").update(data).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return { ok: true };
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return { ok: true };
}

// ── Divisions Public ──────────────────────────────────────────────────────────

export async function createDivisionPublic(data: {
  name: string;
  description: string | null;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("divisions_public").insert(data);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/divisions");
  return { ok: true };
}

export async function updateDivisionPublic(id: string, data: {
  name?: string;
  description?: string | null;
  icon_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("divisions_public").update(data).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/divisions");
  return { ok: true };
}

export async function deleteDivisionPublic(id: string): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("divisions_public").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/divisions");
  return { ok: true };
}

// ── Divisions (real) ──────────────────────────────────────────────────────────

export async function toggleDivisionPublic(id: string, isPublic: boolean): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("divisions").update({ is_public: isPublic }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/divisions");
  return { ok: true };
}

export async function updateDivisionPublicInfo(
  id: string,
  data: { description: string | null; logo_url: string | null },
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("divisions")
    .update({ description: data.description, logo_url: data.logo_url })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/divisions");
  return { ok: true };
}

// ── Site Settings ─────────────────────────────────────────────────────────────

export async function upsertSiteSettings(settings: Record<string, string>): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await admin
    .from("site_settings")
    .upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

// ── Achievements ─────────────────────────────────────────────────────────────

export async function createAchievement(data: {
  title: string;
  description?: string | null;
  placement?: number | null;
  achieved_at: string;
  image_url?: string | null;
  division_id?: string | null;
  organization_id?: string | null;
  tournament_id?: string | null;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("achievements").insert({
    ...data,
    organization_id: data.organization_id ?? null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/achievements");
  return { ok: true };
}

export async function updateAchievement(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    placement?: number | null;
    achieved_at?: string;
    image_url?: string | null;
  },
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("achievements").update(data).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/achievements");
  return { ok: true };
}

export async function deleteAchievement(id: string): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("achievements").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/achievements");
  return { ok: true };
}

// ── Tournament Hero Toggle ────────────────────────────────────────────────────

export async function toggleHeroTournamentAction(
  tournamentId: string,
  nextValue: boolean
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();

  const { error } = await admin
    .from("tournaments")
    .update({ show_in_hero: nextValue })
    .eq("id", tournamentId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/admin/tournaments");
  return { ok: true };
}

export async function toggleTournamentScheduleAction(
  tournamentId: string,
  nextValue: boolean
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();

  const { error } = await admin
    .from("tournaments")
    .update({ show_on_schedule: nextValue })
    .eq("id", tournamentId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin/tournaments");
  return { ok: true };
}

// ── News CMS ──────────────────────────────────────────────────────────────────

export async function createNewsPostAction(data: {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  status: 'draft' | 'published';
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const published_at = data.status === "published" ? new Date().toISOString() : null;
  const { error } = await admin.from("news_posts").insert({
    ...data,
    published_at,
    created_by: user!.id,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { ok: true };
}

export async function updateNewsPostAction(
  id: string,
  data: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    cover_image_url: string | null;
    status: 'draft' | 'published';
  }
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("news_posts")
    .select("status, published_at")
    .eq("id", id)
    .maybeSingle();

  const published_at =
    data.status === "published" && !existing?.published_at
      ? new Date().toISOString()
      : existing?.published_at ?? null;

  const { error } = await admin
    .from("news_posts")
    .update({ ...data, published_at })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/news");
  revalidatePath(`/news/${data.slug}`);
  revalidatePath("/admin/news");
  return { ok: true };
}

export async function deleteNewsPostAction(id: string): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("news_posts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { ok: true };
}

export async function toggleNewsPostStatusAction(
  id: string,
  currentStatus: string
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const nextStatus: 'draft' | 'published' = currentStatus === "published" ? "draft" : "published";
  const published_at = nextStatus === "published" ? new Date().toISOString() : null;
  const { error } = await admin
    .from("news_posts")
    .update({ status: nextStatus, ...(published_at ? { published_at } : {}) })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { ok: true };
}

// ── Results Public Control ─────────────────────────────────────────────────────

export async function toggleResultPublicAction(
  resultId: string,
  nextValue: boolean
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("tournament_results")
    .update({ is_public: nextValue })
    .eq("id", resultId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/results");
  revalidatePath("/admin/results");
  return { ok: true };
}

export async function updateResultImageAction(
  resultId: string,
  imageUrl: string | null
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("tournament_results")
    .update({ result_image_url: imageUrl })
    .eq("id", resultId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/results");
  revalidatePath("/admin/results");
  return { ok: true };
}

// ── About Alumni ─────────────────────────────────────────────────────────────

export async function createAboutAlumnusAction(data: {
  name: string;
  role: string;
  image_url: string | null;
  sort_order: number;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("about_alumni").insert(data);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/about");
  revalidatePath("/admin/about");
  return { ok: true };
}

export async function updateAboutAlumnusAction(
  id: string,
  data: { name?: string; role?: string; image_url?: string | null; sort_order?: number }
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("about_alumni").update(data).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/about");
  revalidatePath("/admin/about");
  return { ok: true };
}

export async function deleteAboutAlumnusAction(id: string): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("about_alumni").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/about");
  revalidatePath("/admin/about");
  return { ok: true };
}

// ── Sponsor Public Control ─────────────────────────────────────────────────────

export async function toggleSponsorPublicAction(
  sponsorId: string,
  nextValue: boolean
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("sponsors")
    .update({ is_public: nextValue })
    .eq("id", sponsorId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/sponsors");
  revalidatePath("/admin/sponsor-control");
  return { ok: true };
}

export async function updateSponsorSortAction(
  sponsorId: string,
  newOrder: number
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("sponsors")
    .update({ public_sort_order: newOrder })
    .eq("id", sponsorId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/sponsors");
  revalidatePath("/admin/sponsor-control");
  return { ok: true };
}
