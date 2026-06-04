import { createClient } from "@supabase/supabase-js";

const E2E_PREFIX = "[E2E]";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing for cleanup");
  return createClient(url, key);
}

/**
 * Delete all rows in `table` where `column` starts with "[E2E]".
 * Uses service role key — bypasses RLS.
 */
export async function cleanupE2ERows(
  table: string,
  column: string
): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from(table)
    .delete()
    .like(column, `${E2E_PREFIX}%`);
  if (error) console.error(`[cleanup] ${table}.${column}:`, error.message);
}

/**
 * Read a site_settings value by key.
 */
export async function getSiteSetting(key: string): Promise<string | null> {
  const client = getClient();
  const { data, error } = await client
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) console.error(`[cleanup] getSiteSetting ${key}:`, error.message);
  return data?.value ?? null;
}

/**
 * Restore a site_settings value by key (used in afterAll for singleton pages).
 */
export async function restoreSiteSetting(
  key: string,
  value: string | null
): Promise<void> {
  if (value === null) return;
  const client = getClient();
  const { error } = await client
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) console.error(`[cleanup] restoreSiteSetting ${key}:`, error.message);
}

export { E2E_PREFIX };
