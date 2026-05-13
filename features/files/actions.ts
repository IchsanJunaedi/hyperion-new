"use server";

import { revalidatePath } from "next/cache";

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
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "Gagal menyimpan record file",
    };
  }

  revalidatePath(`/${orgSlug}/files`);
  return { ok: true, id: data.id };
}
