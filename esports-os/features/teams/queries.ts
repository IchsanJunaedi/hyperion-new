import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Division = Database["public"]["Tables"]["divisions"]["Row"];
export type Scrim = Database["public"]["Tables"]["scrims"]["Row"];
export type Announcement =
  Database["public"]["Tables"]["announcements"]["Row"];
export type TeamMember =
  Database["public"]["Tables"]["team_members"]["Row"];

export interface TeamHomeData {
  organization: Organization;
  divisions: Division[];
  nextScrim: Scrim | null;
  pinnedAnnouncements: Announcement[];
  recentAnnouncements: Announcement[];
  recentCompletedScrims: Scrim[];
  memberCount: number;
  /** Number of completed scrims this calendar month (for the "Quick Stats" card). */
  scrimsThisMonth: number;
  /** Win rate over the most recent ~30 completed scrims, 0..1. Null if no data. */
  recentWinRate: number | null;
}

/**
 * Fetch the org by slug. Returns null if not found.
 *
 * Uses the request-scoped client so RLS applies (anon users can only see
 * is_public = true orgs; authed users see those plus orgs they're members of).
 */
export async function getOrgBySlug(
  slug: string,
): Promise<Organization | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/**
 * Returns true if the current user is a member of the given org.
 * Returns false for anon users or for non-members.
 */
export async function isCurrentUserMember(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("team_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/**
 * Aggregate "Team Home" data for a member-facing workspace.
 *
 * All queries here fail-soft — if a query errors (e.g. RLS denies, or table
 * is empty) the field defaults to null/[]/0. The home page should still
 * render with friendly empty states instead of crashing.
 */
export async function getTeamHomeData(
  organization: Organization,
): Promise<TeamHomeData> {
  const supabase = await createClient();
  const orgId = organization.id;

  // Run independent queries in parallel.
  const nowIso = new Date().toISOString();
  const [
    divisionsRes,
    ongoingScrimRes,
    scheduledScrimRes,
    pinnedRes,
    recentAnnouncementsRes,
    completedRes,
    memberCountRes,
    monthScrimsRes,
  ] = await Promise.all([
    supabase
      .from("divisions")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    // "Next scrim" prefers ongoing over upcoming-scheduled. We split into
    // two queries because an ongoing scrim has scheduled_at in the past
    // and would be filtered out by the gte() bound used for scheduled.
    supabase
      .from("scrims")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "ongoing")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("scrims")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "scheduled")
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("announcements")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("scrims")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false })
      .limit(30),
    supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true),
    // "Scrim bulan ini" excludes cancelled scrims — those didn't
    // actually happen, so they shouldn't inflate the count.
    supabase
      .from("scrims")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["scheduled", "ongoing", "completed"])
      .gte("scheduled_at", startOfMonthIso())
      .lt("scheduled_at", startOfNextMonthIso()),
  ]);

  const completed = completedRes.data ?? [];

  return {
    organization,
    divisions: divisionsRes.data ?? [],
    nextScrim: ongoingScrimRes.data ?? scheduledScrimRes.data ?? null,
    pinnedAnnouncements: pinnedRes.data ?? [],
    recentAnnouncements: recentAnnouncementsRes.data ?? [],
    recentCompletedScrims: completed.slice(0, 5),
    memberCount: memberCountRes.count ?? 0,
    scrimsThisMonth: monthScrimsRes.count ?? 0,
    recentWinRate: computeWinRate(completed),
  };
}

/**
 * Aggregate read-only data for the public team profile (visitor / non-member).
 */
export async function getPublicTeamData(organization: Organization): Promise<{
  organization: Organization;
  divisions: Division[];
  memberCount: number;
}> {
  const supabase = await createClient();
  const [divisionsRes, memberCountRes] = await Promise.all([
    supabase
      .from("divisions")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("is_active", true),
  ]);

  return {
    organization,
    divisions: divisionsRes.data ?? [],
    memberCount: memberCountRes.count ?? 0,
  };
}

function computeWinRate(scrims: Scrim[]): number | null {
  if (scrims.length === 0) return null;
  // We don't have results in this query — would require a join. Return null
  // as a sentinel; the UI shows a "Belum ada data" state. The data layer
  // step (post-migration) will denormalize win/loss onto scrims for cheap
  // aggregation.
  return null;
}

// "Scrim bulan ini" must use WIB month boundaries regardless of server tz.
// On UTC servers, naively using `new Date(yr, mo, 1)` produces midnight UTC =
// 7am WIB, so scrims at 00:00–06:59 WIB on the 1st would be attributed to
// the previous month. Compute the boundary in WIB then convert to UTC ISO.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function startOfMonthIso(): string {
  const now = new Date();
  const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
  const startUtcMs =
    Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), 1) - WIB_OFFSET_MS;
  return new Date(startUtcMs).toISOString();
}

function startOfNextMonthIso(): string {
  const now = new Date();
  const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
  const startUtcMs =
    Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth() + 1, 1) -
    WIB_OFFSET_MS;
  return new Date(startUtcMs).toISOString();
}
