import { createAdminClient } from "@/lib/supabase/admin";

export interface TrialRow {
  id: string;
  org_id: string;
  title: string;
  game: string;
  positions: string[];
  status: "draft" | "active" | "closed";
  public_token: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicantRow {
  id: string;
  trial_id: string;
  name: string;
  ign: string;
  phone: string;
  email: string;
  role_applied: string;
  rank: string;
  server: string;
  main_game: string;
  secondary_game: string | null;
  is_free_agent: boolean;
  age: number;
  social_media: string | null;
  status: "pending" | "accepted" | "rejected" | "waitlisted";
  notes: string | null;
  created_at: string;
}

export interface TrialWithCount extends TrialRow {
  applicant_count: number;
}

export async function listTrials(orgId: string): Promise<TrialWithCount[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("open_trials")
    .select("*, trial_applicants(count)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((t) => ({
    ...t,
    positions: t.positions ?? [],
    applicant_count: (t.trial_applicants as unknown as [{ count: number }])[0]?.count ?? 0,
  })) as TrialWithCount[];
}

export async function getTrialById(id: string): Promise<TrialRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("open_trials")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as TrialRow | null) ?? null;
}

export async function getTrialByToken(token: string): Promise<(TrialRow & { org_name: string }) | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("open_trials")
    .select("*, organizations(name)")
    .eq("public_token", token)
    .maybeSingle();

  if (!data) return null;
  const org = data.organizations as unknown as { name: string } | null;
  return { ...(data as unknown as TrialRow), org_name: org?.name ?? "Tim" };
}

export async function listApplicants(trialId: string): Promise<ApplicantRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trial_applicants")
    .select("*")
    .eq("trial_id", trialId)
    .order("created_at", { ascending: false });
  return (data as ApplicantRow[]) ?? [];
}
