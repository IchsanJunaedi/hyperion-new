import { matchHero } from "@/features/scrim/data/hero-fuzzy";
import { ROLES, type RoleName } from "@/features/scrim/data/mlbb-heroes";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DraftResult {
  bans: { our: string[]; enemy: string[] };
  picks: {
    our: Record<RoleName, string>;
    enemy: Record<RoleName, string>;
  };
}

export interface ScoreboardPlayer {
  displayName: string;
  heroName: string;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
}

export interface ScoreboardResult {
  isWin: boolean;
  ourScore: number;
  opponentScore: number;
  durationSeconds: number;
  players: ScoreboardPlayer[];
}

// ── Storage path validation ─────────────────────────────────────────────────

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

export function validateScrimStoragePath(
  path: string,
  orgId: string,
  scrimId: string,
): boolean {
  if (!path || path.includes("..")) return false;
  const re = new RegExp(`^${orgId}/scrim-results/${scrimId}/[^/]+$`);
  // orgId/scrimId are UUIDs from our DB; still guard their shape defensively
  if (!new RegExp(`^${UUID}$`).test(orgId)) return false;
  if (!new RegExp(`^${UUID}$`).test(scrimId)) return false;
  return re.test(path);
}

// ── Prompts + Gemini responseSchema ───────────────────────────────────────────

export const DRAFT_PROMPT = `You are analyzing a Mobile Legends: Bang Bang (MLBB) draft / ban-pick screenshot.
Identify the 5 banned heroes and 5 picked heroes for BOTH teams.
The team on the (typically) blue/left side is "our", the red/right side is "enemy".
Map each pick to its lane role: exp_lane, jungler, mid_lane, gold_lane, roamer.
Return ONLY hero names exactly as printed. If a slot is unreadable, return an empty string.`;

export const SCOREBOARD_PROMPT = `You are analyzing a Mobile Legends: Bang Bang (MLBB) post-match scoreboard screenshot.
Determine whether our team (top block / the side marked VICTORY for us) won, the series/game score,
the match duration in seconds, and each player's display name, hero, kills, deaths, assists, and gold.
Return ONLY values visible in the image. Use 0 for any number you cannot read.`;

export const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    bans: {
      type: "object",
      properties: {
        our: { type: "array", items: { type: "string" } },
        enemy: { type: "array", items: { type: "string" } },
      },
    },
    picks: {
      type: "object",
      properties: {
        our: roleObjectSchema(),
        enemy: roleObjectSchema(),
      },
    },
  },
} as const;

export const SCOREBOARD_SCHEMA = {
  type: "object",
  properties: {
    isWin: { type: "boolean" },
    ourScore: { type: "integer" },
    opponentScore: { type: "integer" },
    durationSeconds: { type: "integer" },
    players: {
      type: "array",
      items: {
        type: "object",
        properties: {
          displayName: { type: "string" },
          heroName: { type: "string" },
          kills: { type: "integer" },
          deaths: { type: "integer" },
          assists: { type: "integer" },
          gold: { type: "integer" },
        },
      },
    },
  },
} as const;

function roleObjectSchema() {
  return {
    type: "object",
    properties: {
      exp_lane: { type: "string" },
      jungler: { type: "string" },
      mid_lane: { type: "string" },
      gold_lane: { type: "string" },
      roamer: { type: "string" },
    },
  };
}

// ── Normalizers ───────────────────────────────────────────────────────────────

function pad5(arr: unknown): string[] {
  const list = Array.isArray(arr) ? arr.map((x) => matchHero(String(x ?? ""))) : [];
  while (list.length < 5) list.push("");
  return list.slice(0, 5);
}

function roleMap(obj: unknown): Record<RoleName, string> {
  const src = (obj ?? {}) as Record<string, unknown>;
  const out = {} as Record<RoleName, string>;
  for (const role of ROLES) {
    out[role] = matchHero(String(src[role] ?? ""));
  }
  return out;
}

export function normalizeDraftResult(raw: Partial<DraftResult>): DraftResult {
  return {
    bans: { our: pad5(raw?.bans?.our), enemy: pad5(raw?.bans?.enemy) },
    picks: { our: roleMap(raw?.picks?.our), enemy: roleMap(raw?.picks?.enemy) },
  };
}

function toInt(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? "0"), 10);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function normalizeScoreboardResult(raw: Partial<ScoreboardResult>): ScoreboardResult {
  const players = Array.isArray(raw?.players) ? raw.players : [];
  return {
    isWin: raw?.isWin === true,
    ourScore: toInt(raw?.ourScore),
    opponentScore: toInt(raw?.opponentScore),
    durationSeconds: toInt(raw?.durationSeconds),
    players: players.map((p) => ({
      displayName: String(p?.displayName ?? "").trim(),
      heroName: matchHero(String(p?.heroName ?? "")),
      kills: toInt(p?.kills),
      deaths: toInt(p?.deaths),
      assists: toInt(p?.assists),
      gold: toInt(p?.gold),
    })),
  };
}
