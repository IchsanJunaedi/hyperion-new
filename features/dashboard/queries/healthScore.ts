import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface HealthScoreBreakdown {
  winRate: number;
  attendanceRate: number;
  availabilityRatio: number;
  activityScore: number;
  total: number;
}

export async function getTeamHealthScore(orgId: string): Promise<HealthScoreBreakdown> {
  const admin = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch scrims + members + recent activity in parallel
  const [scrimsRes, membersRes, recentActivityRes] = await Promise.all([
    admin
      .from("scrims")
      .select("id, scrim_results(is_win)")
      .eq("organization_id", orgId)
      .eq("status", "completed"),
    admin
      .from("team_members")
      .select("availability")
      .eq("organization_id", orgId)
      .eq("is_active", true),
    admin
      .from("scrims")
      .select("id")
      .eq("organization_id", orgId)
      .gte("scheduled_at", thirtyDaysAgo)
      .limit(1),
  ]);

  // Win rate (40%)
  const scrims = scrimsRes.data ?? [];
  let wins = 0;
  for (const s of scrims) {
    const result = Array.isArray(s.scrim_results) ? s.scrim_results[0] : s.scrim_results;
    if (result?.is_win === true) wins++;
  }
  const winRate = scrims.length > 0 ? Math.round((wins / scrims.length) * 100) : 0;

  // Availability ratio (20%)
  const members = membersRes.data ?? [];
  const activeMembers = members.filter((m) => m.availability === "active").length;
  const availabilityRatio = members.length > 0
    ? Math.round((activeMembers / members.length) * 100)
    : 0;

  // Activity score (10%)
  const activityScore = (recentActivityRes.data?.length ?? 0) > 0 ? 100 : 0;

  // Attendance rate (30%) — fetch all scrim IDs for org then query attendances
  let attendanceRate = 0;
  const allScrimsRes = await admin
    .from("scrims")
    .select("id")
    .eq("organization_id", orgId);

  const allScrimIds = (allScrimsRes.data ?? []).map((s) => s.id);

  if (allScrimIds.length > 0) {
    const attendanceRes = await admin
      .from("scrim_attendances")
      .select("status")
      .in("scrim_id", allScrimIds);

    const attendances = attendanceRes.data ?? [];
    const confirmed = attendances.filter((a) => a.status === "confirmed").length;
    attendanceRate = attendances.length > 0
      ? Math.round((confirmed / attendances.length) * 100)
      : 0;
  }

  // Weighted total
  const total = Math.round(
    winRate * 0.4 +
    attendanceRate * 0.3 +
    availabilityRatio * 0.2 +
    activityScore * 0.1,
  );

  return { winRate, attendanceRate, availabilityRatio, activityScore, total };
}
