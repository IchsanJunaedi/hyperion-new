import { describe, it, expect } from "vitest";
import {
  createContentSchema,
  contentPlatformSchema,
  contentStatusSchema,
  PLATFORM_LABELS,
} from "../content";

// ─── helpers ────────────────────────────────────────────────────────────────
const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) =>
  schema.safeParse(value).success;

// ─── contentPlatformSchema ───────────────────────────────────────────────────
describe("contentPlatformSchema", () => {
  it("accepts all valid platforms", () => {
    expect(ok(contentPlatformSchema, "ig")).toBe(true);
    expect(ok(contentPlatformSchema, "tiktok")).toBe(true);
    expect(ok(contentPlatformSchema, "x")).toBe(true);
  });
  it("rejects unknown platform", () => expect(ok(contentPlatformSchema, "youtube")).toBe(false));
  it("rejects empty string", () => expect(ok(contentPlatformSchema, "")).toBe(false));
});

// ─── contentStatusSchema ─────────────────────────────────────────────────────
describe("contentStatusSchema", () => {
  it("accepts all valid statuses", () => {
    for (const s of ["draft", "scheduled", "approved", "published"]) {
      expect(ok(contentStatusSchema, s)).toBe(true);
    }
  });
  it("rejects unknown status", () => expect(ok(contentStatusSchema, "archived")).toBe(false));
});

// ─── PLATFORM_LABELS ─────────────────────────────────────────────────────────
describe("PLATFORM_LABELS", () => {
  it("has labels for all supported platforms", () => {
    expect(PLATFORM_LABELS["ig"]).toBe("Instagram");
    expect(PLATFORM_LABELS["tiktok"]).toBe("TikTok");
    expect(PLATFORM_LABELS["x"]).toBe("X / Twitter");
  });
});

// ─── createContentSchema ─────────────────────────────────────────────────────
describe("createContentSchema", () => {
  const VALID = {
    platform: "ig" as const,
    title: "Match Recap vs Team Alpha",
    scheduled_at: "2026-06-01T10:00:00.000Z",
  };

  it("accepts valid content with all fields", () => expect(ok(createContentSchema, VALID)).toBe(true));

  it("accepts content with optional description", () =>
    expect(ok(createContentSchema, { ...VALID, description: "Game recap highlights" })).toBe(true));

  it("trims and nullifies empty description", () => {
    const r = createContentSchema.safeParse({ ...VALID, description: "   " });
    expect(r.success && r.data?.description).toBeNull();
  });

  it("sets description to null when omitted", () => {
    const r = createContentSchema.safeParse(VALID);
    expect(r.success && r.data?.description).toBeNull();
  });

  it("rejects empty title", () =>
    expect(ok(createContentSchema, { ...VALID, title: "" })).toBe(false));

  it("rejects title exceeding 200 chars", () =>
    expect(ok(createContentSchema, { ...VALID, title: "A".repeat(201) })).toBe(false));

  it("rejects description exceeding 2000 chars", () =>
    expect(ok(createContentSchema, { ...VALID, description: "A".repeat(2001) })).toBe(false));

  it("rejects invalid platform", () =>
    expect(ok(createContentSchema, { ...VALID, platform: "youtube" })).toBe(false));

  it("rejects empty scheduled_at", () =>
    expect(ok(createContentSchema, { ...VALID, scheduled_at: "" })).toBe(false));

  it("rejects non-date scheduled_at string", () =>
    expect(ok(createContentSchema, { ...VALID, scheduled_at: "not-a-date" })).toBe(false));

  it("accepts tiktok as valid platform", () =>
    expect(ok(createContentSchema, { ...VALID, platform: "tiktok" })).toBe(true));

  it("accepts x as valid platform", () =>
    expect(ok(createContentSchema, { ...VALID, platform: "x" })).toBe(true));

  it("rejects missing required title", () =>
    expect(ok(createContentSchema, { platform: "ig", scheduled_at: "2026-06-01T10:00:00.000Z" })).toBe(false));

  it("rejects missing required scheduled_at", () =>
    expect(ok(createContentSchema, { platform: "ig", title: "My Post" })).toBe(false));

  it("rejects missing required platform", () =>
    expect(ok(createContentSchema, { title: "My Post", scheduled_at: "2026-06-01T10:00:00.000Z" })).toBe(false));
});
