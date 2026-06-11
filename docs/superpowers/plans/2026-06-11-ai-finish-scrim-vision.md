# AI-Assisted Finish Scrim via Dual Screenshot Upload (Gemini Vision) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a coach upload a Draft screenshot and a Scoreboard screenshot per game on the Finish Scrim page; Gemini Vision auto-fills bans/picks/win-loss/scores and (editable) player KDA, then generates a per-game "Draft vs Execution" tactical narrative shown on the Scrim Results page.

**Architecture:** A server action receives a Supabase Storage *path* (image already uploaded to the private `org-private` bucket by the existing upload flow), validates the path belongs to the caller's org+scrim, downloads the bytes via the admin client, base64-encodes them, and calls `gemini-2.0-flash` with a structured `responseSchema`. Returned hero names are normalized via a pure fuzzy matcher against `MLBB_HEROES`. The Finish Scrim form merges the result into existing React state for review/edit before the normal save path runs. On save, a second action sends the final draft + scoreboard to Gemini for a narrative, persisted (one row per game) in a new `scrim_ai_reviews` table and rendered as a premium card on the results page.

**Tech Stack:** Next.js 15 App Router (Server Actions), Supabase (Postgres + private Storage + admin client), `@google/genai` SDK (Gemini 2.0 Flash), Vitest, TypeScript strict.

---

## Design Decisions (locked — object before execution if wrong)

1. **Model / cost:** `gemini-2.0-flash` (free AI Studio tier). SDK: `@google/genai`. Server-only env var `GEMINI_API_KEY` (distinct from the graphify CLI key). If the key is unset, the analyze/review actions return `{ ok:false, message }` gracefully — the manual flow keeps working.
2. **Storage:** Reuse the existing **private** `org-private` bucket. Screenshots are NOT made public. The Vision action downloads bytes server-side and sends base64. CLAUDE.md Rule "validate upload URL against `/storage/v1/object/public/`" does **not** apply here (private bucket, no public URL); instead we validate the storage **path prefix** `${orgId}/scrim-results/${scrimId}/`.
3. **AI review storage:** New table `scrim_ai_reviews`, one row per `(scrim_id, game_number)`, with `narrative text`, plus `scoreboard jsonb` and `draft jsonb` snapshots.
4. **KDA persistence:** Per-player KDA from the scoreboard scan is stored ONLY inside `scrim_ai_reviews.scoreboard` (JSONB) and shown editable in the review step. We do NOT create a normalized per-player stats table (YAGNI — the current form/schema stores no KDA). Bans, picks, win/loss, and scores continue to flow into the existing `scrim_draft_bans` / `scrim_draft_picks` / `scrim_game_results` / `scrim_results` tables exactly as today.
5. **HMR rule:** All new components use `const X = () => {}; export { X };` — never `export default function` / `export function`.

---

## File Structure

**Create:**
- `lib/ai/gemini.ts` — lazy Gemini client + `generateStructured()` and `generateText()` wrappers.
- `features/scrim/data/hero-fuzzy.ts` — pure `matchHero(raw)` fuzzy normalizer against `MLBB_HEROES`.
- `features/scrim/data/__tests__/hero-fuzzy.test.ts` — unit tests.
- `features/scrim/ai/screenshot-schema.ts` — Gemini prompts + `responseSchema` objects + `normalizeDraftResult()` / `normalizeScoreboardResult()` + `validateScrimStoragePath()` (all pure).
- `features/scrim/ai/__tests__/screenshot-schema.test.ts` — unit tests for normalizers + path validator.
- `features/scrim/actions/analyzeScreenshotAction.ts` — server action: auth + download + Gemini + normalize.
- `features/scrim/actions/tacticalReviewAction.ts` — server action: generate + persist narrative.
- `features/scrim/components/ScreenshotDropzone.tsx` — reusable upload+analyze dropzone.
- `features/scrim/queries/aiReviews.ts` — `getScrimAiReviews(scrimId)`.
- `features/scrim/components/AiTacticalReviewCard.tsx` — results-page card.
- `supabase/migrations/20260611120000_scrim_ai_reviews.sql` — table + RLS.

**Modify:**
- `package.json` — add `@google/genai` dep.
- `features/scrim/components/FinishScrimForm.tsx` — dropzones, loading, autofill wiring, scoreboard review state, call tactical review on save.
- `types/database.ts` — add `scrim_ai_reviews` Row/Insert/Update.
- `app/[team-slug]/(workspace)/scrim/[id]/results/page.tsx` — fetch + render `AiTacticalReviewCard` under each game's draft.
- `.env.example` (if present) / `CLAUDE.md` env section — document `GEMINI_API_KEY`.

---

## Task 0: Add Gemini SDK + client wrapper

**Files:**
- Modify: `package.json`
- Create: `lib/ai/gemini.ts`

- [ ] **Step 1: Install the SDK**

Run: `npm install @google/genai`
Expected: `package.json` gains `"@google/genai": "^0.x"` under dependencies; `package-lock.json` updated.

- [ ] **Step 2: Create the client wrapper**

Create `lib/ai/gemini.ts`:

```ts
import "server-only";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.0-flash";

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super("GEMINI_API_KEY belum dikonfigurasi");
    this.name = "GeminiNotConfiguredError";
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiNotConfiguredError();
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export interface ImagePart {
  mimeType: string;
  /** base64-encoded image bytes (no data: prefix) */
  data: string;
}

/** Call Gemini with an image + prompt, forcing a JSON response that matches `responseSchema`. */
export async function generateStructured<T>(args: {
  prompt: string;
  image: ImagePart;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema: Record<string, any>;
}): Promise<T> {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: args.prompt },
          { inlineData: { mimeType: args.image.mimeType, data: args.image.data } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: args.responseSchema,
      temperature: 0,
    },
  });
  const text = res.text;
  if (!text) throw new Error("Gemini mengembalikan respons kosong");
  return JSON.parse(text) as T;
}

/** Call Gemini for a free-text narrative (no image). */
export async function generateText(prompt: string): Promise<string> {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: 0.4 },
  });
  return res.text ?? "";
}
```

- [ ] **Step 3: Document the env var**

In `CLAUDE.md` "Environment Variables" block, add under `# App`:

```bash
GEMINI_API_KEY=                 # Google AI Studio key for scrim screenshot Vision (free tier: gemini-2.0-flash)
```

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: exit 0 (no usages yet, just the new file compiles).

- [ ] **Step 5: Commit**

```bash
rtk git add package.json package-lock.json lib/ai/gemini.ts CLAUDE.md
rtk git commit -m "feat: add Gemini Vision client wrapper for scrim AI"
```

---

## Task 1: Hero fuzzy matcher (pure logic, TDD)

**Files:**
- Create: `features/scrim/data/hero-fuzzy.ts`
- Test: `features/scrim/data/__tests__/hero-fuzzy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `features/scrim/data/__tests__/hero-fuzzy.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { matchHero } from "../hero-fuzzy";

describe("matchHero", () => {
  it("returns exact canonical name unchanged", () => {
    expect(matchHero("Fanny")).toBe("Fanny");
  });

  it("is case- and space-insensitive", () => {
    expect(matchHero("  yu zhong ")).toBe("Yu Zhong");
  });

  it("corrects a small OCR typo (1-2 chars off)", () => {
    expect(matchHero("Lanclot")).toBe("Lancelot"); // transposition/missing char
    expect(matchHero("Guslon")).toBe("Gusion");
  });

  it("returns the raw trimmed string when nothing is close", () => {
    expect(matchHero("zzzzzzz")).toBe("zzzzzzz");
  });

  it("returns empty string for empty/whitespace input", () => {
    expect(matchHero("   ")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run features/scrim/data/__tests__/hero-fuzzy.test.ts`
Expected: FAIL with "Cannot find module '../hero-fuzzy'".

- [ ] **Step 3: Write minimal implementation**

Create `features/scrim/data/hero-fuzzy.ts`:

```ts
import { MLBB_HEROES } from "./mlbb-heroes";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const NORMALIZED = MLBB_HEROES.map((h) => ({ canonical: h, norm: normalize(h) }));

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/**
 * Map a raw (possibly OCR-mangled) hero name to the closest canonical MLBB hero.
 * Returns the trimmed raw input if no canonical name is within the edit-distance
 * threshold (so coaches can still see and correct it manually).
 */
export function matchHero(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const target = normalize(trimmed);

  // Exact normalized hit
  const exact = NORMALIZED.find((h) => h.norm === target);
  if (exact) return exact.canonical;

  // Threshold scales with length but caps at 2 to avoid wrong matches on short names
  const threshold = Math.min(2, Math.floor(target.length / 4) + 1);
  let best: { canonical: string; dist: number } | null = null;
  for (const h of NORMALIZED) {
    const dist = levenshtein(target, h.norm);
    if (dist <= threshold && (!best || dist < best.dist)) {
      best = { canonical: h.canonical, dist };
    }
  }
  return best ? best.canonical : trimmed;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run features/scrim/data/__tests__/hero-fuzzy.test.ts`
Expected: PASS (5 tests). If "Guslon"→"Gusion" fails because the threshold is too tight, the test documents intent — adjust `threshold` cap reasoning, not the test's expectation, and re-run.

- [ ] **Step 5: Commit**

```bash
rtk git add features/scrim/data/hero-fuzzy.ts features/scrim/data/__tests__/hero-fuzzy.test.ts
rtk git commit -m "feat: add fuzzy hero name matcher for OCR results"
```

---

## Task 2: Prompts, response schemas, normalizers, path validator (pure logic, TDD)

**Files:**
- Create: `features/scrim/ai/screenshot-schema.ts`
- Test: `features/scrim/ai/__tests__/screenshot-schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `features/scrim/ai/__tests__/screenshot-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  normalizeDraftResult,
  normalizeScoreboardResult,
  validateScrimStoragePath,
} from "../screenshot-schema";

describe("validateScrimStoragePath", () => {
  const orgId = "11111111-1111-1111-1111-111111111111";
  const scrimId = "22222222-2222-2222-2222-222222222222";

  it("accepts a path under the org+scrim folder", () => {
    const path = `${orgId}/scrim-results/${scrimId}/game-1-123.png`;
    expect(validateScrimStoragePath(path, orgId, scrimId)).toBe(true);
  });

  it("rejects traversal / wrong org / wrong scrim", () => {
    expect(validateScrimStoragePath(`${orgId}/scrim-results/${scrimId}/../x.png`, orgId, scrimId)).toBe(false);
    expect(validateScrimStoragePath(`other/scrim-results/${scrimId}/g.png`, orgId, scrimId)).toBe(false);
    expect(validateScrimStoragePath(`${orgId}/scrim-results/zzzz/g.png`, orgId, scrimId)).toBe(false);
    expect(validateScrimStoragePath("", orgId, scrimId)).toBe(false);
  });
});

describe("normalizeDraftResult", () => {
  it("fuzzy-corrects hero names and pads bans to 5", () => {
    const out = normalizeDraftResult({
      bans: { our: ["Lanclot"], enemy: [] },
      picks: {
        our: { exp_lane: "Yu zhong", jungler: "", mid_lane: "", gold_lane: "", roamer: "" },
        enemy: { exp_lane: "", jungler: "", mid_lane: "", gold_lane: "", roamer: "" },
      },
    });
    expect(out.bans.our).toHaveLength(5);
    expect(out.bans.our[0]).toBe("Lancelot");
    expect(out.picks.our.exp_lane).toBe("Yu Zhong");
  });

  it("tolerates missing fields without throwing", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = normalizeDraftResult({} as any);
    expect(out.bans.enemy).toHaveLength(5);
    expect(out.picks.enemy.roamer).toBe("");
  });
});

describe("normalizeScoreboardResult", () => {
  it("clamps and coerces numeric fields", () => {
    const out = normalizeScoreboardResult({
      isWin: true,
      ourScore: 2,
      opponentScore: 1,
      durationSeconds: 900,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      players: [{ displayName: "A", heroName: "Guslon", kills: 5, deaths: 2, assists: 7, gold: 12000 } as any],
    });
    expect(out.isWin).toBe(true);
    expect(out.players[0].heroName).toBe("Gusion");
    expect(out.players[0].kills).toBe(5);
  });

  it("defaults malformed players array to empty", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = normalizeScoreboardResult({ isWin: false } as any);
    expect(out.players).toEqual([]);
    expect(out.ourScore).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run features/scrim/ai/__tests__/screenshot-schema.test.ts`
Expected: FAIL with "Cannot find module '../screenshot-schema'".

- [ ] **Step 3: Write minimal implementation**

Create `features/scrim/ai/screenshot-schema.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run features/scrim/ai/__tests__/screenshot-schema.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
rtk git add features/scrim/ai/screenshot-schema.ts features/scrim/ai/__tests__/screenshot-schema.test.ts
rtk git commit -m "feat: add scrim screenshot prompts, schemas, normalizers"
```

---

## Task 3: `analyzeScreenshotAction` server action

**Files:**
- Create: `features/scrim/actions/analyzeScreenshotAction.ts`

- [ ] **Step 1: Implement the action**

Create `features/scrim/actions/analyzeScreenshotAction.ts`:

```ts
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
        responseSchema: DRAFT_SCHEMA,
      });
      return { ok: true, kind: "draft", data: normalizeDraftResult(raw) };
    }
    const raw = await generateStructured<Partial<ScoreboardResult>>({
      prompt: SCOREBOARD_PROMPT,
      image: { mimeType: mime, data: base64 },
      responseSchema: SCOREBOARD_SCHEMA,
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
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: typecheck exit 0; lint 0 errors (warnings OK).

- [ ] **Step 3: Commit**

```bash
rtk git add features/scrim/actions/analyzeScreenshotAction.ts
rtk git commit -m "feat: add analyzeScreenshotAction (Gemini Vision)"
```

---

## Task 4: `scrim_ai_reviews` migration + types

**Files:**
- Create: `supabase/migrations/20260611120000_scrim_ai_reviews.sql`
- Modify: `types/database.ts`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260611120000_scrim_ai_reviews.sql`:

```sql
-- Per-game AI tactical review (Draft vs Execution) for scrims
CREATE TABLE IF NOT EXISTS scrim_ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id uuid NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  game_number integer NOT NULL,
  narrative text NOT NULL,
  scoreboard jsonb,
  draft jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scrim_id, game_number)
);

ALTER TABLE scrim_ai_reviews ENABLE ROW LEVEL SECURITY;

-- Active org members can read reviews for scrims in their org
CREATE POLICY "scrim_ai_reviews_read_members"
  ON scrim_ai_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM scrims s
      JOIN team_members tm ON tm.organization_id = s.organization_id
      WHERE s.id = scrim_ai_reviews.scrim_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Writes go through the service-role admin client (bypasses RLS); no INSERT/UPDATE policy needed.
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`
Expected: migration applied. If it reports a remote/local mismatch, follow the repair steps in CLAUDE.md (`migration repair --status ...`) then re-run.

- [ ] **Step 3: Add the table to `types/database.ts`**

In `types/database.ts`, inside `Database.public.Tables`, add (alphabetical placement near other `scrim_*` tables):

```ts
      scrim_ai_reviews: {
        Row: {
          id: string;
          scrim_id: string;
          game_number: number;
          narrative: string;
          scoreboard: Json | null;
          draft: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          scrim_id: string;
          game_number: number;
          narrative: string;
          scoreboard?: Json | null;
          draft?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          scrim_id?: string;
          game_number?: number;
          narrative?: string;
          scoreboard?: Json | null;
          draft?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
```

(Confirm a `Json` type alias already exists at the top of `types/database.ts`; the file uses it for existing `jsonb` columns. If not, use `unknown` instead.)

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
rtk git add supabase/migrations/20260611120000_scrim_ai_reviews.sql types/database.ts
rtk git commit -m "feat: add scrim_ai_reviews table + types"
```

---

## Task 5: `tacticalReviewAction` (generate + persist narrative)

**Files:**
- Create: `features/scrim/actions/tacticalReviewAction.ts`

- [ ] **Step 1: Implement the action**

Create `features/scrim/actions/tacticalReviewAction.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateText, GeminiNotConfiguredError } from "@/lib/ai/gemini";
import type { DraftResult, ScoreboardResult } from "@/features/scrim/ai/screenshot-schema";

const EDIT_ROLES = ["manager", "coach", "captain"];

export interface TacticalReviewGame {
  gameNumber: number;
  isWin: boolean;
  draft: DraftResult | null;
  scoreboard: ScoreboardResult | null;
}

function buildPrompt(g: TacticalReviewGame): string {
  return [
    "Anda adalah analis esports MLBB. Tulis review taktis singkat (3-5 kalimat, Bahasa Indonesia)",
    "yang membandingkan DRAFT (rencana) dengan EKSEKUSI (hasil scoreboard).",
    `Hasil game ${g.gameNumber}: ${g.isWin ? "MENANG" : "KALAH"}.`,
    `Draft kami: ${JSON.stringify(g.draft?.picks.our ?? {})}.`,
    `Draft lawan: ${JSON.stringify(g.draft?.picks.enemy ?? {})}.`,
    `Performa pemain (KDA): ${JSON.stringify(g.scoreboard?.players ?? [])}.`,
    "Fokus: apakah win condition draft tercapai, siapa yang over/underperform, dan 1 saran konkret.",
  ].join("\n");
}

export async function generateTacticalReviewAction(input: {
  scrimId: string;
  orgId: string;
  orgSlug: string;
  games: TacticalReviewGame[];
}): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

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

  // Only review games that have at least a draft or scoreboard scan
  const reviewable = input.games.filter((g) => g.draft || g.scoreboard);
  if (reviewable.length === 0) return { ok: true }; // nothing to do, not an error

  try {
    const rows: Array<{
      scrim_id: string;
      game_number: number;
      narrative: string;
      scoreboard: ScoreboardResult | null;
      draft: DraftResult | null;
      created_by: string;
    }> = [];
    for (const g of reviewable) {
      const narrative = await generateText(buildPrompt(g));
      if (!narrative.trim()) continue;
      rows.push({
        scrim_id: input.scrimId,
        game_number: g.gameNumber,
        narrative: narrative.trim(),
        scoreboard: g.scoreboard,
        draft: g.draft,
        created_by: user.id,
      });
    }
    if (rows.length > 0) {
      const { error } = await admin
        .from("scrim_ai_reviews")
        .upsert(rows, { onConflict: "scrim_id,game_number" });
      if (error) {
        console.error("[tacticalReview] upsert error:", error.message);
        return { ok: false, message: error.message };
      }
    }
    revalidatePath(`/${input.orgSlug}/scrim/${input.scrimId}/results`);
    return { ok: true };
  } catch (err) {
    if (err instanceof GeminiNotConfiguredError) {
      return { ok: false, message: "Fitur AI belum aktif" };
    }
    console.error("[tacticalReview] gemini error:", err);
    return { ok: false, message: "Gagal membuat review taktis" };
  }
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: typecheck exit 0; lint 0 errors.

- [ ] **Step 3: Commit**

```bash
rtk git add features/scrim/actions/tacticalReviewAction.ts
rtk git commit -m "feat: add tactical review generator (draft vs execution)"
```

---

## Task 6: `ScreenshotDropzone` component

**Files:**
- Create: `features/scrim/components/ScreenshotDropzone.tsx`

- [ ] **Step 1: Implement the dropzone**

Create `features/scrim/components/ScreenshotDropzone.tsx`. It uploads to `org-private` (same path convention as the existing screenshot upload), then calls `analyzeScreenshotAction`, and reports the parsed result up via `onAnalyzed`.

```tsx
"use client";

import { useState } from "react";
import { Loader2, Sparkles, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { analyzeScreenshotAction } from "@/features/scrim/actions/analyzeScreenshotAction";
import type { DraftResult, ScoreboardResult } from "@/features/scrim/ai/screenshot-schema";
import { cn } from "@/lib/utils/cn";

type AnalyzedPayload =
  | { kind: "draft"; data: DraftResult }
  | { kind: "scoreboard"; data: ScoreboardResult };

interface ScreenshotDropzoneProps {
  kind: "draft" | "scoreboard";
  label: string;
  orgId: string;
  scrimId: string;
  gameIndex: number;
  onAnalyzed: (payload: AnalyzedPayload) => void;
}

const ScreenshotDropzone = ({
  kind, label, orgId, scrimId, gameIndex, onAnalyzed,
}: ScreenshotDropzoneProps) => {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { toast.error("Gambar maksimal 10MB"); return; }
    setBusy(true);
    setDone(false);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${orgId}/scrim-results/${scrimId}/game-${gameIndex + 1}-${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("org-private")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) { toast.error(upErr.message); return; }

      const res = await analyzeScreenshotAction({ kind, storagePath: path, orgId, scrimId });
      if (!res.ok) { toast.error(res.message); return; }

      if (res.kind === "draft") onAnalyzed({ kind: "draft", data: res.data });
      else onAnalyzed({ kind: "scoreboard", data: res.data });
      setDone(true);
      toast.success("AI selesai membaca — periksa & koreksi bila perlu");
    } catch {
      toast.error("Gagal memproses gambar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors",
        busy
          ? "border-yellow-400/40 bg-yellow-400/5 text-yellow-300"
          : done
          ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
          : "border-ui-border text-ui-text-2 hover:bg-ui-elevated",
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : done ? <CheckCircle2 className="h-3.5 w-3.5" />
        : <Sparkles className="h-3.5 w-3.5 text-yellow-400" />}
      <span className="flex-1">
        {busy ? "AI sedang memproses gambar…" : done ? `${label} terbaca` : label}
      </span>
      <Upload className="h-3.5 w-3.5 opacity-60" />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </label>
  );
};

export { ScreenshotDropzone };
export type { AnalyzedPayload };
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: typecheck exit 0; lint 0 errors.

- [ ] **Step 3: Commit**

```bash
rtk git add features/scrim/components/ScreenshotDropzone.tsx
rtk git commit -m "feat: add AI screenshot dropzone component"
```

---

## Task 7: Wire dropzones + autofill into `FinishScrimForm`

**Files:**
- Modify: `features/scrim/components/FinishScrimForm.tsx`

- [ ] **Step 1: Extend `GameResult` state with scoreboard scan**

In `FinishScrimForm.tsx`, update the `GameResult` interface and `makeBlankGame`:

```ts
interface GameResult {
  isWin: boolean | null;
  notes: string;
  imageUrl: string | null;
  uploading: boolean;
  draft: DraftPicks;
  scoreboard: ScoreboardResult | null; // AI-scanned, editable, persisted to scrim_ai_reviews
}

function makeBlankGame(): GameResult {
  return { isWin: null, notes: "", imageUrl: null, uploading: false, draft: makeBlankDraft(), scoreboard: null };
}
```

Add the import at the top:

```ts
import { ScreenshotDropzone } from "./ScreenshotDropzone";
import type { AnalyzedPayload } from "./ScreenshotDropzone";
import type { DraftResult, ScoreboardResult } from "@/features/scrim/ai/screenshot-schema";
import { ROLES } from "@/features/scrim/data/mlbb-heroes";
import { generateTacticalReviewAction } from "../actions/tacticalReviewAction";
```

- [ ] **Step 2: Add the autofill merge handler**

Inside the component, add a handler that maps an AI payload into existing draft/win-loss state for a given game index:

```ts
function applyDraftScan(i: number, d: DraftResult) {
  setGames((prev) => prev.map((g, idx) => {
    if (idx !== i) return g;
    const our = { ...g.draft.our };
    const enemy = { ...g.draft.enemy };
    for (const role of ROLES) {
      if (d.picks.our[role]) our[role] = { hero: d.picks.our[role], playerId: g.draft.our[role].playerId };
      if (d.picks.enemy[role]) enemy[role] = d.picks.enemy[role];
    }
    return {
      ...g,
      draft: {
        our,
        enemy,
        bans: {
          our: d.bans.our.length ? d.bans.our : g.draft.bans.our,
          enemy: d.bans.enemy.length ? d.bans.enemy : g.draft.bans.enemy,
        },
      },
    };
  }));
}

function applyScoreboardScan(i: number, s: ScoreboardResult) {
  setGames((prev) => prev.map((g, idx) =>
    idx === i ? { ...g, isWin: s.isWin, scoreboard: s } : g,
  ));
}

function handleAnalyzed(i: number, payload: AnalyzedPayload) {
  if (payload.kind === "draft") applyDraftScan(i, payload.data);
  else applyScoreboardScan(i, payload.data);
}
```

- [ ] **Step 3: Render the two dropzones in the active game card**

In the "Active game card" block, directly above the existing `<DraftSection ... />`, insert:

```tsx
{/* AI auto-fill */}
<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
  <ScreenshotDropzone
    kind="draft"
    label="Upload Screenshot Draft"
    orgId={orgId}
    scrimId={scrimId}
    gameIndex={activeGame}
    onAnalyzed={(p) => handleAnalyzed(activeGame, p)}
  />
  <ScreenshotDropzone
    kind="scoreboard"
    label="Upload Screenshot Scoreboard"
    orgId={orgId}
    scrimId={scrimId}
    gameIndex={activeGame}
    onAnalyzed={(p) => handleAnalyzed(activeGame, p)}
  />
</div>
```

- [ ] **Step 4: Render an editable KDA review block (when a scoreboard scan exists)**

Below `<DraftSection ... />` and above the "Game notes" textarea, insert a compact editable table bound to `game.scoreboard.players`. Use `NumberInput` for K/D/A:

```tsx
{game.scoreboard && game.scoreboard.players.length > 0 && (
  <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3 space-y-2">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-yellow-300">
      Hasil Scan Scoreboard — periksa & koreksi
    </p>
    {game.scoreboard.players.map((pl, pIdx) => (
      <div key={pIdx} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
        <input
          value={pl.heroName}
          onChange={(e) => updateScoreboardPlayer(activeGame, pIdx, { heroName: e.target.value })}
          className="h-7 rounded border border-ui-border bg-ui-surface px-2 text-xs text-ui-text"
        />
        {(["kills", "deaths", "assists"] as const).map((stat) => (
          <NumberInput
            key={stat}
            min={0}
            value={String(pl[stat])}
            onChange={(e) => updateScoreboardPlayer(activeGame, pIdx, { [stat]: parseInt(e.target.value || "0", 10) })}
            className="h-7 w-14 text-center text-xs text-ui-text bg-ui-surface border-ui-border"
            containerClassName="w-14"
          />
        ))}
      </div>
    ))}
  </div>
)}
```

Add the `updateScoreboardPlayer` helper near the other update helpers:

```ts
function updateScoreboardPlayer(i: number, pIdx: number, patch: Partial<ScoreboardResult["players"][number]>) {
  setGames((prev) => prev.map((g, idx) => {
    if (idx !== i || !g.scoreboard) return g;
    const players = g.scoreboard.players.map((pl, j) => (j === pIdx ? { ...pl, ...patch } : pl));
    return { ...g, scoreboard: { ...g.scoreboard, players } };
  }));
}
```

- [ ] **Step 5: Fire the tactical review after a successful save**

In `handleSubmit`, after the existing `if (res.ok) {` branch succeeds and BEFORE `router.push(...)`, build the review payload from current state and call the action. Failures must NOT block navigation (AI is best-effort):

```ts
if (res.ok) {
  // Best-effort AI tactical review (non-blocking on failure)
  const reviewGames = games
    .map((g, i) => ({
      gameNumber: i + 1,
      isWin: g.isWin === true,
      draft: extractDraftResult(g.draft),
      scoreboard: g.scoreboard,
    }))
    .filter((g) => g.draft || g.scoreboard);
  if (reviewGames.length > 0) {
    const aiRes = await generateTacticalReviewAction({ scrimId, orgId, orgSlug, games: reviewGames });
    if (!aiRes.ok) toast.message(aiRes.message ?? "Review AI dilewati");
  }
  toast.success("Hasil scrim disimpan!");
  router.push(`/${orgSlug}/analytics`);
} else {
  setError(res.message ?? "Gagal menyimpan hasil");
}
```

Add the `extractDraftResult` helper (converts the form's `DraftPicks` into the `DraftResult` shape the action expects; returns `null` when the draft is empty so we don't review blank games):

```ts
function extractDraftResult(draft: DraftPicks): DraftResult | null {
  const our = {} as DraftResult["picks"]["our"];
  const enemy = {} as DraftResult["picks"]["enemy"];
  let hasAny = false;
  for (const role of ROLES) {
    our[role] = draft.our[role].hero;
    enemy[role] = draft.enemy[role];
    if (draft.our[role].hero || draft.enemy[role]) hasAny = true;
  }
  const bansOur = draft.bans?.our ?? [];
  const bansEnemy = draft.bans?.enemy ?? [];
  if (bansOur.some(Boolean) || bansEnemy.some(Boolean)) hasAny = true;
  if (!hasAny) return null;
  return { bans: { our: bansOur, enemy: bansEnemy }, picks: { our, enemy } };
}
```

- [ ] **Step 6: Manual verification (dev server)**

Run: `npm run dev`, open a scrim's Finish page as a coach. Upload a draft screenshot → confirm picks/bans populate and a toast appears. Upload a scoreboard → confirm Win/Loss toggles and the KDA review block renders. Edit a hero name. Save → confirm redirect + no console errors.
Expected: autofill works; manual edits persist; save succeeds.

- [ ] **Step 7: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: typecheck exit 0; lint 0 errors.

- [ ] **Step 8: Commit**

```bash
rtk git add features/scrim/components/FinishScrimForm.tsx
rtk git commit -m "feat: dual-screenshot AI autofill in Finish Scrim form"
```

---

## Task 8: Results page — AI tactical review card

**Files:**
- Create: `features/scrim/queries/aiReviews.ts`
- Create: `features/scrim/components/AiTacticalReviewCard.tsx`
- Modify: `app/[team-slug]/(workspace)/scrim/[id]/results/page.tsx`

- [ ] **Step 1: Add the query**

Create `features/scrim/queries/aiReviews.ts`:

```ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ScrimAiReview {
  game_number: number;
  narrative: string;
  created_at: string;
}

export async function getScrimAiReviews(scrimId: string): Promise<ScrimAiReview[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scrim_ai_reviews")
    .select("game_number, narrative, created_at")
    .eq("scrim_id", scrimId)
    .order("game_number", { ascending: true })
    .limit(30);
  if (error) {
    console.error("[getScrimAiReviews]", error.message);
    return [];
  }
  return data ?? [];
}
```

- [ ] **Step 2: Add the card component**

Create `features/scrim/components/AiTacticalReviewCard.tsx`:

```tsx
import { Sparkles } from "lucide-react";

interface AiTacticalReviewCardProps {
  narrative: string;
}

const AiTacticalReviewCard = ({ narrative }: AiTacticalReviewCardProps) => {
  return (
    <div className="mt-3 rounded-xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/[0.06] to-transparent p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-yellow-300">
          Tinjauan Taktis AI — Draft vs Eksekusi
        </p>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ui-text-2">{narrative}</p>
    </div>
  );
};

export { AiTacticalReviewCard };
```

- [ ] **Step 3: Fetch + render on the results page**

In `app/[team-slug]/(workspace)/scrim/[id]/results/page.tsx`:

Add imports:

```ts
import { getScrimAiReviews } from "@/features/scrim/queries/aiReviews";
import { AiTacticalReviewCard } from "@/features/scrim/components/AiTacticalReviewCard";
```

Add `getScrimAiReviews(id)` to the existing parallel fetch (or a separate `await` after it), then build a lookup:

```ts
const aiReviews = await getScrimAiReviews(id);
const reviewByGame = new Map(aiReviews.map((r) => [r.game_number, r.narrative]));
```

In the per-game render loop (where each game's draft is shown), after the draft block for a game with `game_number`, render:

```tsx
{reviewByGame.get(g.game_number) && (
  <AiTacticalReviewCard narrative={reviewByGame.get(g.game_number)!} />
)}
```

(Use the same `game_number` field the loop already iterates over from `gamesWithUrls` / `gameResults`.)

- [ ] **Step 4: Manual verification**

Reload a finished scrim's `/results` page that had screenshots scanned. Confirm a yellow "Tinjauan Taktis AI" card appears under the relevant game's draft.
Expected: narrative renders; games without a review show nothing extra.

- [ ] **Step 5: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: typecheck exit 0; lint 0 errors.

- [ ] **Step 6: Commit**

```bash
rtk git add features/scrim/queries/aiReviews.ts features/scrim/components/AiTacticalReviewCard.tsx "app/[team-slug]/(workspace)/scrim/[id]/results/page.tsx"
rtk git commit -m "feat: render AI tactical review on scrim results page"
```

---

## Task 9: Full CI gate + final push

**Files:** none (verification only)

- [ ] **Step 1: Run the full pre-commit gate**

Run: `npm run lint && npm run typecheck && npm run test:unit:coverage`
Expected: lint 0 errors; typecheck exit 0; all unit tests pass; coverage thresholds met (statements 80% / branches 75% / functions 80% / lines 80%). The new pure-logic files (`hero-fuzzy.ts`, `screenshot-schema.ts`) are covered by Tasks 1–2. If coverage dipped because the new server actions/components are in scope, confirm `vitest.config.ts` coverage `include`/`exclude` — server actions hitting Gemini/Supabase are integration-only and should be excluded the same way other `actions.ts` files are; do NOT lower thresholds.

- [ ] **Step 2: Push**

Run: `rtk git push`
Expected: `main` updated.

---

## Self-Review Notes

- **Spec §1 (UI dropzones + loading):** Task 6 (`ScreenshotDropzone` with "AI sedang memproses gambar…") + Task 7 Step 3.
- **Spec §2 (endpoint + Gemini structured JSON):** Tasks 0, 2, 3. Schemas match the spec's JSON shapes exactly (bans.our/enemy, picks.our/enemy by lane; scoreboard isWin/ourScore/opponentScore/durationSeconds/players[]).
- **Spec §3 (auto-fill + review/edit + fuzzy matching):** Task 1 (fuzzy) + Task 7 (merge into state, editable hero + KDA).
- **Spec §4 (tactical narrative + store + results card):** Tasks 4, 5, 8.
- **Hard rules:** all new components use `const X = () => {}; export { X }` (HMR); queries use `.limit(30)`, explicit columns, `.maybeSingle()`, error logging; storage path validated (private-bucket prefix; the public-URL rule is documented as inapplicable); no `select("*")` in new list queries. Existing `useEffect` in the form is unchanged.
- **Open risk:** Gemini free-tier rate/quota limits — actions degrade gracefully to manual entry on any error. No ret- ry/backoff added (YAGNI; revisit if quota errors become common).
