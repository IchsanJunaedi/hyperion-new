"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendWaMessage } from "@/lib/utils/fonnte";

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
  raw: { title: unknown; game: unknown; positions: unknown },
  revalidatePaths: string[]
): Promise<ActionResult> {
  const session = await getManagerOrCoach();
  if (!session) return { ok: false, message: "Akses ditolak" };

  const title = String(raw.title ?? "").trim();
  const game = String(raw.game ?? "").trim();
  const positions = Array.isArray(raw.positions)
    ? (raw.positions as string[]).filter(Boolean)
    : [];

  if (!title || !game) return { ok: false, message: "Judul dan game wajib diisi" };

  const admin = createAdminClient();
  const { error } = await admin.from("open_trials").insert({
    org_id: session.orgId,
    title,
    game,
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

  const { error } = await admin
    .from("trial_applicants")
    .update({ status, notes: notes ?? null })
    .eq("id", applicantId)
    .eq("trial_id", trialId);

  if (error) return { ok: false, message: error.message };
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
    .eq("id", applicantId);

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
}): Promise<ActionResult> {
  const trialId = String(raw.trial_id ?? "").trim();
  const name = String(raw.name ?? "").trim();
  const ign = String(raw.ign ?? "").trim();
  const phone = String(raw.phone ?? "")
    .trim()
    .replace(/\D/g, "");
  const email = String(raw.email ?? "").trim();
  const roleApplied = String(raw.role_applied ?? "").trim();
  const rank = String(raw.rank ?? "").trim();
  const server = String(raw.server ?? "").trim();
  const mainGame = String(raw.main_game ?? "").trim();
  const secondaryGame = String(raw.secondary_game ?? "").trim() || null;
  const isFreeAgent =
    raw.is_free_agent === true || raw.is_free_agent === "true";
  const age = parseInt(String(raw.age ?? "0"), 10);
  const socialMedia = String(raw.social_media ?? "").trim() || null;

  if (
    !trialId ||
    !name ||
    !ign ||
    !phone ||
    !email ||
    !roleApplied ||
    !rank ||
    !server ||
    !mainGame ||
    !age
  ) {
    return { ok: false, message: "Semua field wajib diisi" };
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
    return {
      ok: false,
      message: "Nomor WhatsApp sudah terdaftar di trial ini",
    };

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
  });

  if (error) return { ok: false, message: error.message };

  await sendWaMessage(
    phone,
    `Halo ${name}! Pendaftaran trial *${trial.title}* berhasil diterima.\n\nData kamu:\n- IGN: ${ign}\n- Role: ${roleApplied}\n- Rank: ${rank} (${server})\n\nTim akan menghubungi kamu setelah proses seleksi selesai. Semangat!`
  );

  return { ok: true };
}
