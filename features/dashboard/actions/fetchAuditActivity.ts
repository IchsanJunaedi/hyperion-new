"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActivityPoint = { day: string; count: number };

export async function fetchAuditActivity(
  daysBack: 7 | 30,
): Promise<ActivityPoint[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  // SQL GROUP BY on server — returns one row per active day instead of all log rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).rpc("get_audit_activity_by_day", {
    p_since: since.toISOString(),
  }) as { data: Array<{ day_label: string; cnt: number }> | null };

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.day_label, Number(row.cnt));
  }

  const result: ActivityPoint[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Jakarta",
    });
    result.push({ day: dayStr, count: counts.get(dayStr) ?? 0 });
  }
  return result;
}
