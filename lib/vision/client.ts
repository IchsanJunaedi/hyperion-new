/**
 * Vision server client — calls the local FastAPI MLBB vision server to analyze
 * draft and scoreboard screenshots from a remote image URL (e.g. Fonnte media).
 *
 * Used by the WhatsApp webhook flow where images arrive as Fonnte-hosted URLs,
 * not Supabase storage paths (unlike analyzeScreenshotAction).
 */

import { assignRoles } from "@/features/scrim/data/roleAssignment";
import {
  normalizeDraftResult,
  normalizeScoreboardResult,
  type DraftResult,
  type ScoreboardResult,
} from "@/features/scrim/ai/screenshot-schema";

const VISION_SERVER_URL =
  process.env.MLBB_VISION_URL ?? "http://127.0.0.1:8000";
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
  durationSeconds: number;
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Failed to fetch image: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString("base64");
}

async function callVisionServer<T>(path: string, base64: string): Promise<T> {
  const res = await fetch(`${VISION_SERVER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64 }),
    signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Vision server ${path} responded ${res.status}`);
  }
  return (await res.json()) as T;
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

export async function analyzeDraftImage(imageUrl: string): Promise<DraftResult> {
  const base64 = await fetchImageAsBase64(imageUrl);
  const raw = await callVisionServer<DraftServerResponse>("/analyze-draft", base64);
  return normalizeDraftResult({
    bans: { our: raw.bans ?? [], enemy: raw.enemyBans ?? [] },
  });
}

export async function analyzeScoreboardImage(
  imageUrl: string,
): Promise<ScoreboardResult> {
  const base64 = await fetchImageAsBase64(imageUrl);
  const raw = await callVisionServer<ScoreboardServerResponse>(
    "/analyze-scoreboard",
    base64,
  );
  const players = toScoreboardPlayers(raw.players);
  const enemyPlayers = toScoreboardPlayers(raw.enemyPlayers);
  return normalizeScoreboardResult({
    isWin: raw.result === "win",
    ourScore: players.reduce((sum, p) => sum + p.kills, 0),
    opponentScore: enemyPlayers.reduce((sum, p) => sum + p.kills, 0),
    durationSeconds: raw.durationSeconds ?? 0,
    players,
    enemyPlayers,
  });
}
