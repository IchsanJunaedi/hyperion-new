import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type FileRow = Database["public"]["Tables"]["files"]["Row"];

export async function getLinkedFiles(
  orgId: string,
  refType: string,
  refId: string,
): Promise<FileRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("files")
    .select("*")
    .eq("organization_id", orgId)
    .eq("ref_type", refType)
    .eq("ref_id", refId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}
