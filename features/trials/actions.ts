"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendWaMessage } from "@/lib/utils/fonnte";

const STORAGE_PREFIX = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`
  : null;

function isValidStorageUrl(url: string | null): boolean {
  if (!url) return true;
  if (!STORAGE_PREFIX) return true;
  return url.startsWith(STORAGE_PREFIX);
}

const TRIAL_RATE_LIMIT_MAX = 3;
const TRIAL_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

async function checkTrialRateLimit(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const identifier = `trial:${email}`;
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("login_rate_limits")
    .select("attempts, locked_until")
    .eq("identifier", identifier)
    .maybeSingle();

  if (data?.locked_until && new Date(data.locked_until) > now) return false;

  const lockExpired = !data?.locked_until || new Date(data.locked_until) <= now;
  const prevAttempts = lockExpired ? 0 : (data?.attempts ?? 0);
  const newAttempts = prevAttempts + 1;
  const lockedUntil = newAttempts >= TRIAL_RATE_LIMIT_MAX
    ? new Date(now.getTime() + TRIAL_RATE_LIMIT_WINDOW_MS).toISOString()
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("login_rate_limits").upsert({
    identifier,
    attempts: newAttempts,
    locked_until: lockedUntil,
    updated_at: now.toISOString(),
  });

  return true;
}

type ActionResult = { ok: true } | { ok: false; message: string };

async function getManagerOrCoach() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", ["manager", "coach", "owner"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { user, orgId: data.organization_id, role: data.role };
}

export async function createTrialAction(
  raw: { title: unknown; division_id: unknown; positions: unknown },
  revalidatePaths: string[]
): Promise<ActionResult> {
  const session = await getManagerOrCoach();
  if (!session) return { ok: false, message: "Akses ditolak" };

  const title = String(raw.title ?? "").trim();
  const divisionId = String(raw.division_id ?? "").trim();
  const positions = Array.isArray(raw.positions)
    ? (raw.positions as string[]).filter(Boolean)
    : [];

  if (!title || !divisionId) return { ok: false, message: "Judul dan divisi wajib diisi" };

  const admin = createAdminClient();

  // Verify division belongs to this org and get game
  const { data: division } = await admin
    .from("divisions")
    .select("id, game")
    .eq("id", divisionId)
    .eq("organization_id", session.orgId)
    .maybeSingle();
  if (!division) return { ok: false, message: "Divisi tidak ditemukan" };

  const { error } = await admin.from("open_trials").insert({
    org_id: session.orgId,
    division_id: divisionId,
    title,
    game: division.game,
    positions,
    created_by: session.user.id,
  });

  if (error) return { ok: false, message: error.message };
  revalidatePaths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

export async function updateTrialStatusAction(
  trialId: string,
  status: "draft" | "active" | "closed",
  revalidatePaths: string[]
): Promise<ActionResult> {
  const session = await getManagerOrCoach();
  if (!session) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("open_trials")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", trialId)
    .eq("org_id", session.orgId);

  if (error) return { ok: false, message: error.message };
  revalidatePaths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

export async function updateApplicantStatusAction(
  applicantId: string,
  trialId: string,
  status: "pending" | "accepted" | "rejected" | "waitlisted",
  notes: string | undefined,
  revalidatePaths: string[]
): Promise<ActionResult> {
  const session = await getManagerOrCoach();
  if (!session) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();

  const { data: trial } = await admin
    .from("open_trials")
    .select("id, org_id")
    .eq("id", trialId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!trial) return { ok: false, message: "Trial tidak ditemukan" };

  const { data: applicant, error } = await admin
    .from("trial_applicants")
    .update({ status, notes: notes ?? null })
    .eq("id", applicantId)
    .eq("trial_id", trialId)
    .select("name, phone")
    .single();

  if (error) return { ok: false, message: error.message };

  // WA notification when accepted or rejected
  if ((status === "accepted" || status === "rejected") && applicant?.phone) {
    const { data: trialInfo } = await admin
      .from("open_trials")
      .select("title, game")
      .eq("id", trialId)
      .maybeSingle();
    if (trialInfo) {
      const waMsg =
        status === "accepted"
          ? `Halo ${applicant.name}!\n\nSelamat, kamu *DITERIMA* dalam open trial untuk posisi ${trialInfo.title} (${trialInfo.game}).\n\nKami akan segera menghubungi kamu lebih lanjut. Terima kasih sudah mendaftar!`
          : `Halo ${applicant.name},\n\nTerima kasih sudah mendaftar open trial ${trialInfo.title} (${trialInfo.game}).\n\nSayang sekali, kamu belum bisa bergabung kali ini. Tetap semangat dan pantau open trial berikutnya!`;
      sendWaMessage(applicant.phone, waMsg).catch((err) =>
        console.error("[WA Trial Status]", err),
      );
    }
  }

  revalidatePaths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

export async function deleteApplicantAction(
  applicantId: string,
  trialId: string,
  revalidatePaths: string[]
): Promise<ActionResult> {
  const session = await getManagerOrCoach();
  if (!session) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { data: trial } = await admin
    .from("open_trials")
    .select("id, org_id")
    .eq("id", trialId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!trial) return { ok: false, message: "Trial tidak ditemukan" };

  const { error } = await admin
    .from("trial_applicants")
    .delete()
    .eq("id", applicantId)
    .eq("trial_id", trialId);

  if (error) return { ok: false, message: error.message };
  revalidatePaths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

export async function registerApplicantAction(raw: {
  trial_id: unknown;
  name: unknown;
  ign: unknown;
  phone: unknown;
  email: unknown;
  role_applied: unknown;
  rank: unknown;
  server: unknown;
  main_game: unknown;
  secondary_game: unknown;
  is_free_agent: unknown;
  age: unknown;
  social_media: unknown;
  city: unknown;
  game_id: unknown;
  game_nickname: unknown;
  win_rate: unknown;
  hero_pool: unknown;
  competitive_exp: unknown;
  screenshot_url: unknown;
  cv_url: unknown;
}): Promise<ActionResult> {
  const trialId = String(raw.trial_id ?? "").trim();
  const name = String(raw.name ?? "").trim();
  const ign = String(raw.ign ?? "").trim();
  const phone = String(raw.phone ?? "").trim().replace(/\D/g, "");
  const email = String(raw.email ?? "").trim();
  const roleApplied = String(raw.role_applied ?? "").trim();
  const rank = String(raw.rank ?? "").trim();
  const server = String(raw.server ?? "").trim() || "ID";
  const mainGame = String(raw.main_game ?? "").trim();
  const secondaryGame = String(raw.secondary_game ?? "").trim() || null;
  const isFreeAgent = raw.is_free_agent === true || raw.is_free_agent === "true";
  const age = parseInt(String(raw.age ?? "0"), 10);
  const socialMedia = String(raw.social_media ?? "").trim() || null;
  const city = String(raw.city ?? "").trim() || null;
  const gameId = String(raw.game_id ?? "").trim() || null;
  const gameNickname = String(raw.game_nickname ?? "").trim() || null;
  const winRate = String(raw.win_rate ?? "").trim() || null;
  const heroPool = Array.isArray(raw.hero_pool)
    ? (raw.hero_pool as string[]).filter(Boolean)
    : [];
  const competitiveExp = String(raw.competitive_exp ?? "").trim() || null;
  const screenshotUrl = String(raw.screenshot_url ?? "").trim() || null;
  const cvUrl = String(raw.cv_url ?? "").trim() || null;

  if (
    !trialId || !name || !ign || !phone || !email ||
    !roleApplied || !rank || !mainGame || !socialMedia ||
    isNaN(age) || age < 10 || age > 99
  ) {
    return { ok: false, message: "Semua field wajib diisi" };
  }

  if (!screenshotUrl) {
    return { ok: false, message: "Screenshot profil wajib diupload" };
  }

  if (!isValidStorageUrl(screenshotUrl) || !isValidStorageUrl(cvUrl)) {
    return { ok: false, message: "URL file tidak valid" };
  }

  const allowed = await checkTrialRateLimit(email);
  if (!allowed) {
    return { ok: false, message: "Terlalu banyak pendaftaran. Coba lagi dalam 1 jam." };
  }

  const admin = createAdminClient();

  const { data: trial } = await admin
    .from("open_trials")
    .select("id, title, status")
    .eq("id", trialId)
    .maybeSingle();

  if (!trial) return { ok: false, message: "Trial tidak ditemukan" };
  if (trial.status !== "active")
    return { ok: false, message: "Pendaftaran trial ini sudah ditutup" };

  const { data: existing } = await admin
    .from("trial_applicants")
    .select("id")
    .eq("trial_id", trialId)
    .eq("phone", phone)
    .maybeSingle();
  if (existing)
    return { ok: false, message: "Nomor WhatsApp sudah terdaftar di trial ini" };

  const { error } = await admin.from("trial_applicants").insert({
    trial_id: trialId,
    name,
    ign,
    phone,
    email,
    role_applied: roleApplied,
    rank,
    server,
    main_game: mainGame,
    secondary_game: secondaryGame,
    is_free_agent: isFreeAgent,
    age,
    social_media: socialMedia,
    city,
    game_id: gameId,
    game_nickname: gameNickname,
    win_rate: winRate,
    hero_pool: heroPool.length > 0 ? heroPool : null,
    competitive_exp: competitiveExp,
    screenshot_url: screenshotUrl,
    cv_url: cvUrl,
  });

  if (error) return { ok: false, message: error.message };

  try {
    await sendWaMessage(
      phone,
      `Halo ${name}! Pendaftaran trial *${trial.title}* berhasil diterima.\n\nData kamu:\n- IGN: ${ign}\n- Role: ${roleApplied}\n- Rank: ${rank}\n\nTim akan menghubungi kamu setelah proses seleksi selesai. Semangat!`
    );
  } catch (err) {
    console.error("[registerApplicantAction] WA send failed:", err);
  }

  return { ok: true };
}
