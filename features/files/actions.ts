"use server";

import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface FileActionError {
  ok: false;
  message: string;
}

/**
 * Persist an upload record to the `files` table after a successful
 * Supabase Storage upload. Called from the FileUpload client component.
 * `uploaded_by` is resolved server-side from the auth session to prevent
 * client spoofing.
 */
export async function recordFileUploadAction(
  orgSlug: string,
  orgId: string,
  payload: {
    storage_path: string;
    file_name: string;
    file_type: string;
    file_size: number;
    division_id?: string | null;
    ref_type?: string | null;
    ref_id?: string | null;
  },
): Promise<FileActionError | { ok: true; id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data, error } = await supabase
    .from("files")
    .insert({
      organization_id: orgId,
      uploaded_by: user.id,
      bucket_name: "org-private",
      storage_path: payload.storage_path,
      file_name: payload.file_name,
      file_type: payload.file_type,
      file_size: payload.file_size,
      division_id: payload.division_id ?? null,
      ref_type: payload.ref_type ?? null,
      ref_id: payload.ref_id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "Gagal menyimpan record file",
    };
  }

  await logAudit({
    actorId: user.id,
    action: "file.upload",
    entityType: "file",
    entityId: data.id,
    metadata: { name: payload.file_name, size: payload.file_size, type: payload.file_type },
  });

  revalidatePath(`/${orgSlug}/files`);
  return { ok: true, id: data.id };
}

/**
 * Delete a file from Storage and the `files` table, then emit an audit event.
 * Runs server-side so the actor is resolved from the session (not trusting
 * client input) and the audit trail cannot be bypassed.
 */
export async function deleteFileAction(
  orgSlug: string,
  orgId: string,
  storagePath: string,
): Promise<FileActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Only coach+ may delete files — mirrors upload permission gate
  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = user.email === ownerEmail;
  const allowedRoles = ["owner", "manager", "coach"];
  if (!isOwner && (!member || !allowedRoles.includes(member.role))) {
    return { ok: false, message: "Tidak ada akses untuk menghapus file" };
  }

  // Guard against path traversal — storage path must belong to this org
  if (!storagePath.startsWith(`${orgId}/`)) {
    return { ok: false, message: "Path file tidak valid" };
  }

  const admin = createAdminClient();

  const { error: storageError } = await admin.storage
    .from("org-private")
    .remove([storagePath]);

  if (storageError) {
    return { ok: false, message: "Gagal menghapus file dari storage" };
  }

  await admin.from("files").delete().eq("storage_path", storagePath);

  await logAudit({
    actorId: user.id,
    action: "file.delete",
    entityType: "file",
    metadata: {
      name: storagePath.split("/").pop() ?? storagePath,
      path: storagePath,
      orgId,
    },
  });

  revalidatePath(`/${orgSlug}/files`);
  return { ok: true };
}
