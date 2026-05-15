import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ScrimRequest = Database["public"]["Tables"]["scrim_requests"]["Row"];

export interface ScrimRequestWithOrgs extends ScrimRequest {
  from_org: { name: string; slug: string; logo_url: string | null } | null;
  to_org: { name: string; slug: string; logo_url: string | null } | null;
  division: { name: string } | null;
}

/**
 * List incoming scrim requests (requests TO this org).
 */
export async function listIncomingRequests(
  orgId: string,
): Promise<ScrimRequestWithOrgs[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scrim_requests")
    .select("*")
    .eq("to_org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data || data.length === 0) return [];
  return enrichRequests(supabase, data);
}

/**
 * List outgoing scrim requests (requests FROM this org).
 */
export async function listOutgoingRequests(
  orgId: string,
): Promise<ScrimRequestWithOrgs[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scrim_requests")
    .select("*")
    .eq("from_org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data || data.length === 0) return [];
  return enrichRequests(supabase, data);
}

/**
 * List teams in the same division (potential matchmaking targets).
 */
export async function listMatchableTeams(
  orgId: string,
  divisionId: string,
): Promise<Array<{ id: string; name: string; slug: string; logo_url: string | null }>> {
  const supabase = await createClient();

  // Find orgs that have the same division game
  const { data: myDiv } = await supabase
    .from("divisions")
    .select("game")
    .eq("id", divisionId)
    .maybeSingle();

  if (!myDiv) return [];

  // Find other orgs with divisions in the same game
  const { data: otherDivs } = await supabase
    .from("divisions")
    .select("organization_id")
    .eq("game", myDiv.game)
    .neq("organization_id", orgId)
    .eq("is_active", true);

  if (!otherDivs || otherDivs.length === 0) return [];

  const orgIds = [...new Set(otherDivs.map((d) => d.organization_id).filter(Boolean))] as string[];
  if (orgIds.length === 0) return [];

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url")
    .in("id", orgIds)
    .eq("is_public", true);

  return orgs ?? [];
}

async function enrichRequests(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requests: ScrimRequest[],
): Promise<ScrimRequestWithOrgs[]> {
  const orgIds = [...new Set([
    ...requests.map((r) => r.from_org_id),
    ...requests.map((r) => r.to_org_id),
  ])];
  const divIds = [...new Set(requests.map((r) => r.division_id))];

  const [orgsRes, divsRes] = await Promise.all([
    supabase.from("organizations").select("id, name, slug, logo_url").in("id", orgIds),
    supabase.from("divisions").select("id, name").in("id", divIds),
  ]);

  const orgMap = new Map((orgsRes.data ?? []).map((o) => [o.id, o]));
  const divMap = new Map((divsRes.data ?? []).map((d) => [d.id, d]));

  return requests.map((r) => ({
    ...r,
    from_org: orgMap.get(r.from_org_id) ?? null,
    to_org: orgMap.get(r.to_org_id) ?? null,
    division: divMap.get(r.division_id) ?? null,
  }));
}
