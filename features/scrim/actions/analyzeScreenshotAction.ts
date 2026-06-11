"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateStructured, GeminiNotConfiguredError } from "@/lib/ai/gemini";
import {
  DRAFT_PROMPT,
  DRAFT_SCHEMA,
  SCOREBOARD_PROMPT,
  SCOREBOARD_SCHEMA,
  normalizeDraftResult,
  normalizeScoreboardResult,
  validateScrimStoragePath,
  type DraftResult,
  type ScoreboardResult,
} from "@/features/scrim/ai/screenshot-schema";
import { detectMimeType } from "@/lib/utils/file";

type AnalyzeResult =
  | { ok: true; kind: "draft"; data: DraftResult }
  | { ok: true; kind: "scoreboard"; data: ScoreboardResult }
  | { ok: false; message: string };

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const EDIT_ROLES = ["manager", "coach", "captain"];

export async function analyzeScreenshotAction(input: {
  kind: "draft" | "scoreboard";
  storagePath: string;
  orgId: string;
  scrimId: string;
}): Promise<AnalyzeResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Authorize: owner OR active coach/captain/manager in this org
  const admin = createAdminClient();
  const isOwner = user.email === process.env.OWNER_EMAIL;
  if (!isOwner) {
    const { data: member } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", input.orgId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!member || !EDIT_ROLES.includes(member.role)) {
      return { ok: false, message: "Akses ditolak" };
    }
  }

  // Validate the path belongs to this org+scrim folder (defends the admin download)
  if (!validateScrimStoragePath(input.storagePath, input.orgId, input.scrimId)) {
    return { ok: false, message: "Path file tidak valid" };
  }

  // Confirm the scrim actually belongs to this org
  const { data: scrim } = await admin
    .from("scrims")
    .select("id, organization_id")
    .eq("id", input.scrimId)
    .maybeSingle();
  if (!scrim || scrim.organization_id !== input.orgId) {
    return { ok: false, message: "Scrim tidak ditemukan" };
  }

  // Download bytes from the private bucket
  const { data: blob, error: dlErr } = await admin.storage
    .from("org-private")
    .download(input.storagePath);
  if (dlErr || !blob) {
    console.error("[analyzeScreenshot] download error:", dlErr?.message);
    return { ok: false, message: "Gagal membaca gambar" };
  }

  const buffer = await blob.arrayBuffer();
  const mime = detectMimeType(buffer);
  if (!mime || !ALLOWED_MIME.includes(mime)) {
    return { ok: false, message: "Format gambar tidak didukung (PNG/JPG/WebP)" };
  }
  const base64 = Buffer.from(buffer).toString("base64");

  try {
    if (input.kind === "draft") {
      const raw = await generateStructured<Partial<DraftResult>>({
        prompt: DRAFT_PROMPT,
        image: { mimeType: mime, data: base64 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: DRAFT_SCHEMA as Record<string, any>,
      });
      return { ok: true, kind: "draft", data: normalizeDraftResult(raw) };
    }
    const raw = await generateStructured<Partial<ScoreboardResult>>({
      prompt: SCOREBOARD_PROMPT,
      image: { mimeType: mime, data: base64 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: SCOREBOARD_SCHEMA as Record<string, any>,
    });
    return { ok: true, kind: "scoreboard", data: normalizeScoreboardResult(raw) };
  } catch (err) {
    if (err instanceof GeminiNotConfiguredError) {
      return { ok: false, message: "Fitur AI belum aktif (GEMINI_API_KEY belum diset)" };
    }
    console.error("[analyzeScreenshot] gemini error:", err);
    return { ok: false, message: "AI gagal membaca gambar. Coba lagi atau isi manual." };
  }
}
