"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "@/lib/validations/announcement";
import type { Database } from "@/types/database";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface CreateAnnouncementResult {
  ok: true;
  announcement: Announcement;
}

/**
 * Create an announcement. Captain+ only (RLS enforced).
 * Optionally fan-out WA blast to active members of the target division
 * (or all org members if no division specified).
 */
export async function createAnnouncementAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | CreateAnnouncementResult> {
  const parsed = createAnnouncementSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgError || !org) return { ok: false, message: "Organisasi tidak ditemukan" };

  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert({
      organization_id: org.id,
      division_id: parsed.data.division_id,
      created_by: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      is_pinned: parsed.data.is_pinned,
      send_wa_blast: parsed.data.send_wa_blast,
      requires_ack: parsed.data.requires_ack,
      published_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !announcement) {
    return {
      ok: false,
      message:
        error?.code === "42501"
          ? "Hanya captain atau owner yang bisa membuat pengumuman"
          : (error?.message ?? "Gagal membuat pengumuman"),
    };
  }

  await logAudit({
    actorId: user.id,
    action: "announcement.create",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { title: announcement.title, orgId: org.id },
  });

  // Fan-out WA blast if requested
  if (parsed.data.send_wa_blast) {
    await fanOutAnnouncementNotifications(
      supabase,
      announcement,
      org.name,
      parsed.data.division_id,
    );
  }

  revalidatePath(`/${orgSlug}/announcements`);
  revalidatePath(`/${orgSlug}`);
  return { ok: true, announcement };
}

async function fanOutAnnouncementNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  announcement: Announcement,
  orgName: string,
  divisionId: string | null,
) {
  let membersQuery = supabase
    .from("team_members")
    .select("user_id")
    .eq("organization_id", announcement.organization_id)
    .eq("is_active", true)
    .limit(500);

  if (divisionId) {
    membersQuery = membersQuery.eq("division_id", divisionId);
  }

  const { data: members } = await membersQuery;
  if (!members || members.length === 0) return;

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, phone_wa")
    .in("id", userIds);
  const phoneMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.phone_wa]),
  );

  const title = `Pengumuman: ${announcement.title}`;
  const bodyPreview =
    announcement.body.length > 100
      ? announcement.body.slice(0, 100) + "…"
      : announcement.body;
  const waMessage = [
    `[${orgName}] Pengumuman Baru`,
    `📢 ${announcement.title}`,
    "",
    bodyPreview,
    "",
    "Buka workspace untuk detail lengkap.",
  ].join("\n");

  const rows = members.map((m) => ({
    organization_id: announcement.organization_id,
    user_id: m.user_id,
    type: "announcement" as const,
    title,
    body: bodyPreview,
    ref_id: announcement.id,
    ref_type: "announcement",
    wa_number: phoneMap.get(m.user_id) ?? null,
    wa_message: phoneMap.get(m.user_id) ? waMessage : null,
  }));

  await supabase.from("notifications").insert(rows);
}

/**
 * Update an existing announcement. Captain+ only (RLS enforced).
 */
export async function updateAnnouncementAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updateAnnouncementSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("announcements")
    .update({
      title: parsed.data.title,
      body: parsed.data.body,
      is_pinned: parsed.data.is_pinned,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa mengedit pengumuman"
          : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "announcement.update",
    entityType: "announcement",
    entityId: parsed.data.id,
    metadata: { title: parsed.data.title },
  });

  revalidatePath(`/${orgSlug}/announcements`);
  revalidatePath(`/${orgSlug}/announcements/${parsed.data.id}`);
  revalidatePath(`/${orgSlug}`);
  return { ok: true };
}

/**
 * Delete an announcement. Captain+ only (RLS enforced).
 */
export async function deleteAnnouncementAction(
  orgSlug: string,
  announcementId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", announcementId);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Hanya captain atau owner yang bisa menghapus pengumuman"
          : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "announcement.delete",
    entityType: "announcement",
    entityId: announcementId,
  });

  revalidatePath(`/${orgSlug}/announcements`);
  revalidatePath(`/${orgSlug}`);
  return { ok: true };
}

/**
 * Explicitly acknowledge a requires_ack announcement. Any authenticated member.
 */
export async function acknowledgeAnnouncementAction(
  orgSlug: string,
  announcementId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("announcement_reads")
    .upsert(
      { announcement_id: announcementId, user_id: user.id },
      { onConflict: "announcement_id,user_id", ignoreDuplicates: true },
    );

  revalidatePath(`/${orgSlug}/announcements/${announcementId}`);
  return { ok: true };
}

/**
 * Toggle pin status of an announcement. Captain+ only.
 */
export async function togglePinAction(
  orgSlug: string,
  announcementId: string,
  pinned: boolean,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("announcements")
    .update({ is_pinned: pinned })
    .eq("id", announcementId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/${orgSlug}/announcements`);
  revalidatePath(`/${orgSlug}`);
  return { ok: true };
}
