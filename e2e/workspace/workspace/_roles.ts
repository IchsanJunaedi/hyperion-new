// Shared constants for workspace (`/{slug}`) specs.
// Each role is a member of [E2E] Org, so all three can access the workspace;
// specs select per-role storageState via test.use().
import { createClient } from "@supabase/supabase-js";

export const SLUG = process.env.E2E_TEST_TEAM_SLUG ?? "e2e-test";

export const WS_ROLES = ["coach", "captain", "member"] as const;
export type WsRole = (typeof WS_ROLES)[number];

export const storageFor = (r: WsRole) => `e2e/.auth/${r}.json`;

export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Resolve the [E2E] Org id + its first division id. */
export async function getE2EOrg(): Promise<{ orgId: string; divisionId: string }> {
  const admin = adminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();
  if (!org) throw new Error("[E2E] Org not found — run workspace-seed first");
  const { data: div } = await admin
    .from("divisions")
    .select("id")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!div) throw new Error("[E2E] Division not found");
  return { orgId: org.id, divisionId: div.id };
}
