"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createContentSchema } from "@/lib/validations/content";
import type { ContentCalendarRow, ContentStatus } from "@/types/database";
import { logAudit } from "@/lib/audit";

type ContentUpdate = Partial<Omit<ContentCalendarRow, "id" | "created_at">>;

export interface ContentActionError {
  ok: false;
  message: string;
}

export async function createContentAction(
  orgId: string,
  raw: unknown,
): Promise<ContentActionError | { ok: true }> {
  const parsed = createContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Form belum lengkap." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login." };

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("role", ["manager", "owner"])
    .maybeSingle();

  if (!membership) return { ok: false, message: "Hanya manager/owner yang bisa membuat konten." };

  const { error } = await admin.from("content_calendar").insert({
    organization_id: orgId,
    platform: parsed.data.platform,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
    status: "draft",
    created_by: user.id,
    approved_by: null,
    approved_at: null,
  });

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "content.create",
    entityType: "content_calendar",
    metadata: { title: parsed.data.title, platform: parsed.data.platform },
  });

  revalidatePath("/manage/content");
  revalidatePath("/dashboard/content");
  return { ok: true };
}

export async function updateContentStatusAction(
  contentId: string,
  orgId: string,
  newStatus: ContentStatus,
): Promise<ContentActionError | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login." };

  const admin = createAdminClient();
  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwnerByEmail = ownerEmail && user.email === ownerEmail;

  const { data: membership } = isOwnerByEmail
    ? { data: { role: "owner" as const } }
    : await admin
        .from("team_members")
        .select("role")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .in("role", ["manager", "owner"])
        .maybeSingle();

  if (!membership) return { ok: false, message: "Akses ditolak." };

  if (newStatus === "approved" && membership.role !== "owner" && !isOwnerByEmail) {
    return { ok: false, message: "Hanya owner yang bisa menyetujui konten." };
  }

  const updateData: ContentUpdate = { status: newStatus };
  if (newStatus === "approved") {
    updateData.approved_by = user.id;
    updateData.approved_at = new Date().toISOString();
  }
  if (newStatus === "draft") {
    updateData.approved_by = null;
    updateData.approved_at = null;
  }

  const { error } = await admin
    .from("content_calendar")
    .update(updateData)
    .eq("id", contentId)
    .eq("organization_id", orgId);

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "content.status_change",
    entityType: "content_calendar",
    entityId: contentId,
    metadata: { to: newStatus },
  });

  revalidatePath("/manage/content");
  revalidatePath("/dashboard/content");
  return { ok: true };
}

export async function deleteContentAction(
  contentId: string,
  orgId: string,
): Promise<ContentActionError | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login." };

  const admin = createAdminClient();
  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwnerByEmail = ownerEmail && user.email === ownerEmail;

  if (!isOwnerByEmail) {
    // Verify the caller is a member of this org before any further checks
    const { data: membership } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("role", ["manager", "owner"])
      .maybeSingle();

    if (!membership) return { ok: false, message: "Akses ditolak." };

    const { data: content } = await admin
      .from("content_calendar")
      .select("created_by, status")
      .eq("id", contentId)
      .maybeSingle();

    if (!content) return { ok: false, message: "Konten tidak ditemukan." };
    if (content.created_by !== user.id || content.status !== "draft") {
      return { ok: false, message: "Manager hanya bisa menghapus draft milik sendiri." };
    }
  }

  const { error } = await admin
    .from("content_calendar")
    .delete()
    .eq("id", contentId)
    .eq("organization_id", orgId);

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "content.delete",
    entityType: "content_calendar",
    entityId: contentId,
  });

  revalidatePath("/manage/content");
  revalidatePath("/dashboard/content");
  return { ok: true };
}
