import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoragePathFromUrl } from "@/lib/utils/file";

export interface TrialRow {
  id: string;
  org_id: string;
  title: string;
  game: string;
  division_id: string | null;
  division_name: string | null;
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
  city: string | null;
  game_id: string | null;
  game_nickname: string | null;
  win_rate: string | null;
  hero_pool: string[] | null;
  competitive_exp: string | null;
  screenshot_url: string | null;
  cv_url: string | null;
  status: "pending" | "accepted" | "rejected" | "waitlisted";
  notes: string | null;
  created_at: string;
}

export interface TrialWithCount extends TrialRow {
  applicant_count: number;
}

const OPEN_TRIAL_COLS =
  "id, org_id, title, game, division_id, positions, status, public_token, created_by, created_at, updated_at";

const TRIAL_APPLICANT_COLS =
  "id, trial_id, name, ign, phone, email, role_applied, rank, server, main_game, secondary_game, is_free_agent, age, social_media, city, game_id, game_nickname, win_rate, hero_pool, competitive_exp, screenshot_url, cv_url, status, notes, created_at";

export async function listTrials(orgId: string): Promise<TrialWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("open_trials")
    .select(`${OPEN_TRIAL_COLS}, divisions(name), trial_applicants(count)`)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((t) => {
    const div = t.divisions as unknown as { name: string } | null;
    return {
      ...t,
      positions: t.positions ?? [],
      division_name: div?.name ?? null,
      applicant_count: Number((t.trial_applicants as unknown as [{ count: string | number }])[0]?.count ?? 0),
    };
  }) as TrialWithCount[];
}

export async function getTrialById(id: string): Promise<TrialRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("open_trials")
    .select(`${OPEN_TRIAL_COLS}, divisions(name)`)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const div = (data as unknown as { divisions: { name: string } | null }).divisions;
  return { ...(data as unknown as TrialRow), division_name: div?.name ?? null };
}

export async function getTrialByToken(token: string): Promise<(TrialRow & { org_name: string }) | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("open_trials")
    .select(`${OPEN_TRIAL_COLS}, organizations(name)`)
    .eq("public_token", token)
    .maybeSingle();

  if (!data) return null;
  const org = data.organizations as unknown as { name: string } | null;
  return { ...(data as unknown as TrialRow), org_name: org?.name ?? "Tim" };
}

export async function listApplicants(trialId: string): Promise<ApplicantRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trial_applicants")
    .select(TRIAL_APPLICANT_COLS)
    .eq("trial_id", trialId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("listApplicants:", error);
    return [];
  }

  const applicants = (data as ApplicantRow[]) ?? [];
  const pathsToSign: string[] = [];

  applicants.forEach((app) => {
    const screenshotPath = getStoragePathFromUrl(app.screenshot_url);
    if (screenshotPath) pathsToSign.push(screenshotPath);

    const cvPath = getStoragePathFromUrl(app.cv_url);
    if (cvPath) pathsToSign.push(cvPath);
  });

  if (pathsToSign.length === 0) {
    return applicants;
  }

  try {
    const admin = createAdminClient();
    const { data: signedData, error: signError } = await admin.storage
      .from("trial-screenshots")
      .createSignedUrls(pathsToSign, 600);

    if (!signError && signedData) {
      const signedMap = new Map<string, string>();
      signedData.forEach((item) => {
        if (item.error) {
          console.error("Signing error for path:", item.path, item.error);
        } else if (item.signedUrl && item.path) {
          signedMap.set(item.path, item.signedUrl);
        }
      });

      applicants.forEach((app) => {
        const screenshotPath = getStoragePathFromUrl(app.screenshot_url);
        if (screenshotPath) {
          app.screenshot_url = signedMap.get(screenshotPath) ?? app.screenshot_url;
        }

        const cvPath = getStoragePathFromUrl(app.cv_url);
        if (cvPath) {
          app.cv_url = signedMap.get(cvPath) ?? app.cv_url;
        }
      });
    }
  } catch (err) {
    console.error("Batch signing failed:", err);
  }

  return applicants;
}

export interface PublicTrial extends TrialRow {
  org_name: string;
  org_slug: string;
  org_logo_url: string | null;
}

export async function getActivePublicTrials(): Promise<PublicTrial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("open_trials")
    .select(`${OPEN_TRIAL_COLS}, organizations(name, slug, logo_url)`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("getActivePublicTrials:", error);
  if (!data) return [];
  return data.map((row) => {
    const org = (row as unknown as { organizations: { name: string; slug: string; logo_url: string | null } | null }).organizations;
    return {
      ...(row as unknown as TrialRow),
      org_name: org?.name ?? "Tim",
      org_slug: org?.slug ?? "",
      org_logo_url: org?.logo_url ?? null,
    };
  });
}
