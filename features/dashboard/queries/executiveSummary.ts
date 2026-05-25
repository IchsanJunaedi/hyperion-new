import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ExecutiveSummary {
  winRate: number;
  totalScrims: number;
  attendanceRate: number;
  activeSponsors: number;
  totalSponsorValue: number;
  netBalance: number;
  activeMemberCount: number;
}

export async function getExecutiveSummary(orgId: string): Promise<ExecutiveSummary> {
  const admin = createAdminClient();

  const [scrimsRes, membersRes, sponsorsRes, financesRes, allScrimsRes] = await Promise.all([
    admin
      .from("scrims")
      .select("id, scrim_results(is_win)")
      .eq("organization_id", orgId)
      .eq("status", "completed"),
    admin
      .from("team_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("is_active", true),
    admin
      .from("sponsors")
      .select("deal_value, status")
      .eq("organization_id", orgId)
      .eq("status", "active"),
    admin
      .from("finances")
      .select("type, amount")
      .eq("organization_id", orgId),
    admin
      .from("scrims")
      .select("id")
      .eq("organization_id", orgId),
  ]);

  // Win rate
  const scrims = scrimsRes.data ?? [];
  let wins = 0;
  for (const s of scrims) {
    const result = Array.isArray(s.scrim_results) ? s.scrim_results[0] : s.scrim_results;
    if (result?.is_win === true) wins++;
  }
  const winRate = scrims.length > 0 ? Math.round((wins / scrims.length) * 100) : 0;

  // Attendance rate
  let attendanceRate = 0;
  const allScrimIds = (allScrimsRes.data ?? []).map((s) => s.id);
  if (allScrimIds.length > 0) {
    const { data: attendances } = await admin
      .from("scrim_attendances")
      .select("status")
      .in("scrim_id", allScrimIds);
    const all = attendances ?? [];
    const confirmed = all.filter((a) => a.status === "confirmed").length;
    attendanceRate = all.length > 0 ? Math.round((confirmed / all.length) * 100) : 0;
  }

  // Sponsor data
  const activeSponsors = sponsorsRes.data ?? [];
  const totalSponsorValue = activeSponsors.reduce((sum, s) => sum + (s.deal_value ?? 0), 0);

  // Net balance
  const finances = financesRes.data ?? [];
  const netBalance = finances.reduce((sum, f) => {
    return sum + (f.type === "income" ? f.amount : -f.amount);
  }, 0);

  return {
    winRate,
    totalScrims: scrims.length,
    attendanceRate,
    activeSponsors: activeSponsors.length,
    totalSponsorValue,
    netBalance,
    activeMemberCount: (membersRes.data ?? []).length,
  };
}
