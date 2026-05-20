"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SponsorStatus, DeliverableStatus, DeliverableCategory } from "./queries";

type ActionResult = { ok: true } | { ok: false; message: string };

async function requireManagerAuth(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, ok: false as const };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email === ownerEmail) return { user, ok: true as const };

  const { data: tm } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .maybeSingle();

  if (!["manager", "owner"].includes(tm?.role ?? "")) return { user: null, ok: false as const };
  return { user, ok: true as const };
}

interface SponsorFormData {
  name: string;
  status: SponsorStatus;
  logo_url: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  deal_value: string;
  currency: string;
  start_date: string;
  end_date: string;
  notes: string;
}

export async function createSponsorAction(
  orgId: string,
  data: SponsorFormData,
): Promise<ActionResult & { id?: string }> {
  const { user, ok } = await requireManagerAuth(orgId);
  if (!ok || !user) return { ok: false, message: "Akses ditolak" };
  if (!data.name.trim()) return { ok: false, message: "Nama sponsor tidak boleh kosong" };

  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from("sponsors")
    .insert({
      organization_id: orgId,
      name: data.name.trim(),
      status: data.status,
      logo_url: data.logo_url.trim() || null,
      contact_name: data.contact_name.trim() || null,
      contact_email: data.contact_email.trim() || null,
      contact_phone: data.contact_phone.trim() || null,
      deal_value: data.deal_value ? parseFloat(data.deal_value) : null,
      currency: data.currency || "IDR",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      notes: data.notes.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/sponsors");
  revalidatePath("/manage/sponsors");
  return { ok: true, id: created.id };
}

export async function updateSponsorAction(
  orgId: string,
  sponsorId: string,
  data: SponsorFormData,
): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("sponsors")
    .update({
      name: data.name.trim(),
      status: data.status,
      logo_url: data.logo_url.trim() || null,
      contact_name: data.contact_name.trim() || null,
      contact_email: data.contact_email.trim() || null,
      contact_phone: data.contact_phone.trim() || null,
      deal_value: data.deal_value ? parseFloat(data.deal_value) : null,
      currency: data.currency || "IDR",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      notes: data.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sponsorId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/sponsors");
  revalidatePath("/manage/sponsors");
  return { ok: true };
}

export async function deleteSponsorAction(orgId: string, sponsorId: string): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin.from("sponsors").delete().eq("id", sponsorId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/dashboard/sponsors");
  revalidatePath("/manage/sponsors");
  return { ok: true };
}

export async function addDeliverableAction(
  orgId: string,
  sponsorId: string,
  data: { title: string; description: string; category: DeliverableCategory; due_date: string },
): Promise<ActionResult & { deliverable?: import("./queries").SponsorDeliverable }> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };
  if (!data.title.trim()) return { ok: false, message: "Judul deliverable tidak boleh kosong" };

  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from("sponsor_deliverables")
    .insert({
      sponsor_id: sponsorId,
      title: data.title.trim(),
      description: data.description.trim() || null,
      category: data.category,
      due_date: data.due_date || null,
    })
    .select("*")
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, deliverable: created };
}

export async function updateDeliverableStatusAction(
  orgId: string,
  deliverableId: string,
  status: DeliverableStatus,
): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("sponsor_deliverables")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliverableId);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function deleteDeliverableAction(orgId: string, deliverableId: string): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin.from("sponsor_deliverables").delete().eq("id", deliverableId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function addSponsorNoteAction(
  orgId: string,
  sponsorId: string,
  content: string,
): Promise<ActionResult & { note?: import("./queries").SponsorNote }> {
  const { user, ok } = await requireManagerAuth(orgId);
  if (!ok || !user) return { ok: false, message: "Akses ditolak" };
  if (!content.trim()) return { ok: false, message: "Catatan tidak boleh kosong" };

  const admin = createAdminClient();
  const { data: note, error } = await admin
    .from("sponsor_notes")
    .insert({ sponsor_id: sponsorId, content: content.trim(), created_by: user.id })
    .select("*")
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, note };
}

export async function deleteSponsorNoteAction(orgId: string, noteId: string): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin.from("sponsor_notes").delete().eq("id", noteId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
