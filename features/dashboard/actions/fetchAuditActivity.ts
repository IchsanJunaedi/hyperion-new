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

  const { data } = await admin
    .from("audit_logs")
    .select("created_at")
    .gte("created_at", since.toISOString());

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const day = new Date(row.created_at).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Jakarta",
    });
    counts.set(day, (counts.get(day) ?? 0) + 1);
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
