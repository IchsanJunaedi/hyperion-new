import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
      .select("*, scrim_results(is_win)")
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

  type CompletedScrim = Scrim & {
    scrim_results: { is_win: boolean | null } | null;
  };
  const completed = (completedRes.data ?? []) as unknown as CompletedScrim[];

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

export interface PersonalPlayerStats {
  attendanceRate: number;
  totalPresent: number;
  totalScrims: number;
  avgRating: number | null;
  winRateWhenPresent: number;
  winsWhenPresent: number;
  scrimsWhenPresent: number;
  streak: number;
  targets: Array<{
    id: string;
    skill_name: string;
    current_level: number;
    target_level: number;
    notes: string | null;
  }>;
}

export async function getPersonalPlayerStats(
  orgId: string,
  userId: string,
): Promise<PersonalPlayerStats | null> {
  const admin = createAdminClient();

  const [scrimsRes, targetsRes] = await Promise.all([
    admin
      .from("scrims")
      .select("id, scrim_results(is_win)")
      .eq("organization_id", orgId)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false })
      .limit(50),
    admin
      .from("player_targets")
      .select("id, skill_name, current_level, target_level, notes")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  const scrims = scrimsRes.data ?? [];
  const totalScrims = scrims.length;
  const targets = (targetsRes.data ?? []).map((t) => ({
    id: t.id,
    skill_name: t.skill_name,
    current_level: t.current_level,
    target_level: t.target_level,
    notes: t.notes,
  }));

  if (totalScrims === 0) {
    return { attendanceRate: 0, totalPresent: 0, totalScrims: 0, avgRating: null, winRateWhenPresent: 0, winsWhenPresent: 0, scrimsWhenPresent: 0, streak: 0, targets };
  }

  const scrimIds = scrims.map((s) => s.id);
  const { data: attendances } = await admin
    .from("scrim_attendances")
    .select("scrim_id, status, rating")
    .in("scrim_id", scrimIds)
    .eq("user_id", userId);

  const allAtt = attendances ?? [];
  const confirmed = allAtt.filter((a) => a.status === "confirmed");
  const totalPresent = confirmed.length;
  const attendanceRate = Math.round((totalPresent / totalScrims) * 100);

  // Win rate when present
  type ScrimRow = { id: string; scrim_results: unknown };
  const scrimResultMap = new Map<string, boolean | null>();
  for (const s of scrims as ScrimRow[]) {
    const arr = Array.isArray(s.scrim_results) ? s.scrim_results : [s.scrim_results];
    const first = arr[0] as { is_win?: boolean | null } | null;
    scrimResultMap.set(s.id, first?.is_win ?? null);
  }
  const confirmedIds = new Set(confirmed.map((a) => a.scrim_id));
  const winsWhenPresent = confirmed.filter((a) => scrimResultMap.get(a.scrim_id) === true).length;
  const scrimsWhenPresent = confirmed.length;
  const winRateWhenPresent = scrimsWhenPresent === 0 ? 0 : Math.round((winsWhenPresent / scrimsWhenPresent) * 100);

  // Avg rating
  const ratings = allAtt.filter((a) => a.rating != null).map((a) => a.rating as number);
  const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10 : null;

  // Streak (newest-first: positive = consecutive present, negative = consecutive absent)
  let streak = 0;
  for (const s of scrims as ScrimRow[]) {
    const isPresent = confirmedIds.has(s.id);
    if (streak === 0) {
      streak = isPresent ? 1 : -1;
    } else if (streak > 0 && isPresent) {
      streak++;
    } else if (streak < 0 && !isPresent) {
      streak--;
    } else {
      break;
    }
  }

  return { attendanceRate, totalPresent, totalScrims, avgRating, winRateWhenPresent, winsWhenPresent, scrimsWhenPresent, streak, targets };
}

function computeWinRate(
  scrims: Array<Scrim & { scrim_results: { is_win: boolean | null } | null }>,
): number | null {
  const withResult = scrims.filter((s) => s.scrim_results !== null);
  if (withResult.length === 0) return null;
  const wins = withResult.filter(
    (s) => s.scrim_results?.is_win === true,
  ).length;
  return wins / withResult.length;
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
