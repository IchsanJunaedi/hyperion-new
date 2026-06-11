"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeDraftResult,
  normalizeScoreboardResult,
  validateScrimStoragePath,
  type DraftResult,
  type ScoreboardResult,
} from "@/features/scrim/ai/screenshot-schema";
import { HERO_CLASSES, ROLES, type RoleName } from "@/features/scrim/data/mlbb-heroes";
import { detectMimeType } from "@/lib/utils/file";

type AnalyzeResult =
  | { ok: true; kind: "draft"; data: DraftResult }
  | { ok: true; kind: "scoreboard"; data: ScoreboardResult }
  | { ok: false; message: string };

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const EDIT_ROLES = ["manager", "coach", "captain"];

// Local vision server (scratch/mlbb-vision/server.py) — replaces Gemini Vision
const VISION_SERVER_URL = process.env.MLBB_VISION_URL ?? "http://127.0.0.1:8000";
const VISION_TIMEOUT_MS = 120_000;

interface DraftServerResponse {
  bans: string[];
  enemyBans: string[];
}

interface ScoreboardServerPlayer {
  hero: string;
  kills: number;
  deaths: number;
  assists: number;
}

interface ScoreboardServerResponse {
  result: "win" | "loss";
  players: ScoreboardServerPlayer[];
  enemyPlayers: ScoreboardServerPlayer[];
}

async function callVisionServer<T>(path: string, base64: string): Promise<T> {
  const res = await fetch(`${VISION_SERVER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64 }),
    signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`vision server ${path} responded ${res.status}`);
  }
  return (await res.json()) as T;
}

const ROLE_WEIGHTS: Record<string, Record<RoleName, number>> = {
  Marksman: { gold_lane: 10, mid_lane: 1, jungler: 1, exp_lane: 1, roamer: 1 },
  Mage:     { mid_lane: 8, gold_lane: 3, roamer: 1, exp_lane: 1, jungler: 1 },
  Tank:     { roamer: 8, exp_lane: 3, jungler: 1, mid_lane: 1, gold_lane: 1 },
  Support:  { roamer: 8, mid_lane: 3, gold_lane: 1, exp_lane: 1, jungler: 1 },
  Assassin: { jungler: 8, roamer: 1, mid_lane: 1, exp_lane: 1, gold_lane: 1 },
  Fighter:  { exp_lane: 6, jungler: 5, roamer: 1, gold_lane: 1, mid_lane: 1 },
};

function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length === 0) return [[]];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const copy = [...arr];
    const elem = copy.splice(i, 1)[0];
    if (elem === undefined) continue;
    const sub = getPermutations(copy);
    for (const s of sub) {
      result.push([elem, ...s]);
    }
  }
  return result;
}

function assignRoles(heroes: string[]): RoleName[] {
  const perms = getPermutations([...ROLES]);
  let bestPerm: RoleName[] = [...ROLES];
  let maxScore = -1;

  for (const perm of perms) {
    let score = 0;
    for (let i = 0; i < heroes.length; i++) {
      const hero = heroes[i];
      const role = perm[i];
      if (hero && role) {
        const cls = HERO_CLASSES[hero] ?? "";
        const weights = ROLE_WEIGHTS[cls] ?? { exp_lane: 1, jungler: 1, mid_lane: 1, gold_lane: 1, roamer: 1 };
        score += weights[role] ?? 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestPerm = perm;
    }
  }
  return bestPerm;
}

function toScoreboardPlayers(serverPlayers: ScoreboardServerPlayer[]) {
  const list = Array.isArray(serverPlayers) ? serverPlayers.slice(0, 5) : [];
  const roles = assignRoles(list.map((p) => p?.hero ?? ""));
  return list.map((p, i) => ({
    displayName: "",
    heroName: p?.hero ?? "",
    role: roles[i] ?? "exp_lane",
    kills: p?.kills ?? 0,
    deaths: p?.deaths ?? 0,
    assists: p?.assists ?? 0,
    gold: 0,
  }));
}

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
      const raw = await callVisionServer<DraftServerResponse>("/analyze-draft", base64);
      return {
        ok: true,
        kind: "draft",
        data: normalizeDraftResult({
          bans: { our: raw.bans ?? [], enemy: raw.enemyBans ?? [] },
        }),
      };
    }

    const raw = await callVisionServer<ScoreboardServerResponse>("/analyze-scoreboard", base64);
    const players = toScoreboardPlayers(raw.players);
    const enemyPlayers = toScoreboardPlayers(raw.enemyPlayers);
    return {
      ok: true,
      kind: "scoreboard",
      data: normalizeScoreboardResult({
        isWin: raw.result === "win",
        ourScore: players.reduce((sum, p) => sum + p.kills, 0),
        opponentScore: enemyPlayers.reduce((sum, p) => sum + p.kills, 0),
        durationSeconds: 0,
        players,
        enemyPlayers,
      }),
    };
  } catch (err) {
    console.error("[analyzeScreenshot] vision server error:", err);
    return {
      ok: false,
      message:
        "Vision server lokal tidak berjalan. Jalankan: python scratch/mlbb-vision/server.py lalu coba lagi.",
    };
  }
}
