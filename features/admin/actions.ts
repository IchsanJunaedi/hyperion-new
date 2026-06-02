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
