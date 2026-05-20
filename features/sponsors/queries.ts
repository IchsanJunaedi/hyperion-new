import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type Sponsor = Database["public"]["Tables"]["sponsors"]["Row"];
export type SponsorDeliverable = Database["public"]["Tables"]["sponsor_deliverables"]["Row"];
export type SponsorNote = Database["public"]["Tables"]["sponsor_notes"]["Row"];
export type SponsorStatus = Sponsor["status"];
export type DeliverableStatus = SponsorDeliverable["status"];
export type DeliverableCategory = SponsorDeliverable["category"];

export interface SponsorWithStats extends Sponsor {
  deliverableTotal: number;
  deliverableDone: number;
}

export interface SponsorDetail extends Sponsor {
  deliverables: SponsorDeliverable[];
  historyNotes: SponsorNote[];
  creatorName: string | null;
}

export async function getSponsors(orgIds: string[]): Promise<SponsorWithStats[]> {
  if (orgIds.length === 0) return [];
  const admin = createAdminClient();

  const { data: sponsors } = await admin
    .from("sponsors")
    .select("*")
    .in("organization_id", orgIds)
    .order("status")
    .order("name");

  if (!sponsors || sponsors.length === 0) return [];

  const sponsorIds = sponsors.map((s) => s.id);
  const { data: deliverables } = await admin
    .from("sponsor_deliverables")
    .select("sponsor_id, status")
    .in("sponsor_id", sponsorIds);

  const dlMap = new Map<string, { total: number; done: number }>();
  for (const d of deliverables ?? []) {
    const cur = dlMap.get(d.sponsor_id) ?? { total: 0, done: 0 };
    dlMap.set(d.sponsor_id, {
      total: cur.total + 1,
      done: cur.done + (d.status === "done" ? 1 : 0),
    });
  }

  return sponsors.map((s) => ({
    ...s,
    deliverableTotal: dlMap.get(s.id)?.total ?? 0,
    deliverableDone: dlMap.get(s.id)?.done ?? 0,
  }));
}

export async function getSponsorDetail(id: string): Promise<SponsorDetail | null> {
  const admin = createAdminClient();

  const { data: sponsor } = await admin
    .from("sponsors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!sponsor) return null;

  const [{ data: deliverables }, { data: notes }] = await Promise.all([
    admin.from("sponsor_deliverables").select("*").eq("sponsor_id", id).order("created_at"),
    admin.from("sponsor_notes").select("*").eq("sponsor_id", id).order("created_at", { ascending: false }),
  ]);

  let creatorName: string | null = null;
  if (sponsor.created_by) {
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, username")
      .eq("id", sponsor.created_by)
      .maybeSingle();
    creatorName = profile?.display_name ?? profile?.username ?? null;
  }

  return {
    ...sponsor,
    deliverables: deliverables ?? [],
    historyNotes: notes ?? [],
    creatorName,
  };
}
