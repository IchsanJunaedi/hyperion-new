import { describe, it, expect } from "vitest";
import {
  profileSetupSchema,
  createOrganizationSchema,
  orgTierEnum,
  supportedGameEnum,
} from "../onboarding";

// ─── helpers ────────────────────────────────────────────────────────────────
const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) =>
  schema.safeParse(value).success;

const firstError = (result: { success: boolean; error?: { errors: { message: string }[] } }) =>
  result.success ? null : result.error?.errors[0]?.message ?? null;

// ─── orgTierEnum ─────────────────────────────────────────────────────────────
describe("orgTierEnum", () => {
  it("accepts all valid tiers", () => {
    expect(ok(orgTierEnum, "pelajar")).toBe(true);
    expect(ok(orgTierEnum, "komunitas")).toBe(true);
    expect(ok(orgTierEnum, "pro")).toBe(true);
  });
  it("rejects unknown tier", () => expect(ok(orgTierEnum, "amateur")).toBe(false));
});

// ─── supportedGameEnum ────────────────────────────────────────────────────────
describe("supportedGameEnum", () => {
  it("accepts all supported games", () => {
    for (const g of ["mobile_legends", "valorant", "pubg_mobile", "free_fire", "dota_2", "cs2"]) {
      expect(ok(supportedGameEnum, g)).toBe(true);
    }
  });
  it("rejects unsupported game", () => expect(ok(supportedGameEnum, "minecraft")).toBe(false));
});

// ─── profileSetupSchema ───────────────────────────────────────────────────────
describe("profileSetupSchema", () => {
  const VALID = {
    full_name: "John Doe",
    username: "johndoe_01",
    date_of_birth: "2000-01-15",
    phone_wa: "081234567890",
  };

  it("accepts valid profile data", () => expect(ok(profileSetupSchema, VALID)).toBe(true));

  it("accepts optional social_links and game_ids", () => {
    expect(ok(profileSetupSchema, {
      ...VALID,
      social_links: { instagram: "@johndoe" },
      game_ids: { mlbb: "123456789", mlbb_server: "2345" },
    })).toBe(true);
  });

  it("rejects full_name shorter than 2 chars", () =>
    expect(ok(profileSetupSchema, { ...VALID, full_name: "J" })).toBe(false));

  it("rejects full_name longer than 100 chars", () =>
    expect(ok(profileSetupSchema, { ...VALID, full_name: "A".repeat(101) })).toBe(false));

  it("rejects username with spaces", () =>
    expect(ok(profileSetupSchema, { ...VALID, username: "john doe" })).toBe(false));

  it("rejects username shorter than 3 chars", () =>
    expect(ok(profileSetupSchema, { ...VALID, username: "jd" })).toBe(false));

  it("rejects username with special chars other than underscore", () =>
    expect(ok(profileSetupSchema, { ...VALID, username: "john-doe" })).toBe(false));

  it("rejects invalid date_of_birth string", () =>
    expect(ok(profileSetupSchema, { ...VALID, date_of_birth: "not-a-date" })).toBe(false));

  it("rejects empty date_of_birth", () =>
    expect(ok(profileSetupSchema, { ...VALID, date_of_birth: "" })).toBe(false));

  it("rejects phone_wa shorter than 10 digits", () =>
    expect(ok(profileSetupSchema, { ...VALID, phone_wa: "0812" })).toBe(false));

  it("rejects phone_wa with letters", () =>
    expect(ok(profileSetupSchema, { ...VALID, phone_wa: "0812abcdef" })).toBe(false));

  it("rejects mlbb_server containing letters", () => {
    expect(ok(profileSetupSchema, {
      ...VALID,
      game_ids: { mlbb_server: "abc" },
    })).toBe(false);
  });
});

// ─── createOrganizationSchema ─────────────────────────────────────────────────
describe("createOrganizationSchema", () => {
  const VALID_DIV = { name: "Mobile Legends", game: "mobile_legends" as const };
  const VALID = {
    name: "Hyperion Esports",
    slug: "hyperion-esports",
    tier: "komunitas" as const,
    divisions: [VALID_DIV],
  };

  it("accepts valid org creation data", () => expect(ok(createOrganizationSchema, VALID)).toBe(true));

  it("rejects name shorter than 2 chars", () =>
    expect(ok(createOrganizationSchema, { ...VALID, name: "X" })).toBe(false));

  it("rejects name longer than 80 chars", () =>
    expect(ok(createOrganizationSchema, { ...VALID, name: "A".repeat(81) })).toBe(false));

  it("rejects invalid slug (starts with dash)", () =>
    expect(ok(createOrganizationSchema, { ...VALID, slug: "-badslug" })).toBe(false));

  it("rejects invalid slug (too short, only 2 chars)", () =>
    expect(ok(createOrganizationSchema, { ...VALID, slug: "ab" })).toBe(false));

  it("rejects invalid tier", () =>
    expect(ok(createOrganizationSchema, { ...VALID, tier: "elite" })).toBe(false));

  it("rejects empty divisions array", () =>
    expect(ok(createOrganizationSchema, { ...VALID, divisions: [] })).toBe(false));

  it("rejects more than 10 divisions", () =>
    expect(ok(createOrganizationSchema, {
      ...VALID,
      divisions: Array(11).fill(VALID_DIV),
    })).toBe(false));

  it("rejects division with unsupported game", () =>
    expect(ok(createOrganizationSchema, {
      ...VALID,
      divisions: [{ name: "Division A", game: "minecraft" }],
    })).toBe(false));

  it("rejects division name shorter than 2 chars", () =>
    expect(ok(createOrganizationSchema, {
      ...VALID,
      divisions: [{ name: "A", game: "valorant" }],
    })).toBe(false));
});
