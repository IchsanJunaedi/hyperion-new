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
  organizationName: string | null;
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
    .select("id, name, status, logo_url, deal_value, currency, start_date, end_date, contact_name, organization_id, organizations(name)")
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

  return sponsors.map((s) => {
    const orgRel = (s as unknown as { organizations?: { name: string } | null }).organizations;
    return {
      ...s,
      deliverableTotal: dlMap.get(s.id)?.total ?? 0,
      deliverableDone: dlMap.get(s.id)?.done ?? 0,
      organizationName: orgRel?.name ?? null,
    };
  }) as unknown as SponsorWithStats[];
}

export interface WorkspaceSponsor {
  id: string;
  name: string;
  status: string;
  logo_url: string | null;
  notes: string | null;
}

export async function getWorkspaceSponsors(orgId: string): Promise<WorkspaceSponsor[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sponsors")
    .select("id, name, status, logo_url, notes")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("name")
    .limit(50);
  if (error) console.error("[getWorkspaceSponsors]", error);
  return (data ?? []) as WorkspaceSponsor[];
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
