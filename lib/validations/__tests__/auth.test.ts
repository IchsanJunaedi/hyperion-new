import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../auth";
import { emailSchema, passwordSchema, waNumberSchema } from "@/lib/validations/shared";

// ─── helpers ────────────────────────────────────────────────────────────────
const ok = <T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, value: unknown) =>
  schema.safeParse(value).success;

const firstError = (result: ReturnType<typeof resetPasswordSchema.safeParse>) =>
  result.success ? null : (result.error?.issues[0]?.message ?? null);

// ─── emailSchema ─────────────────────────────────────────────────────────────
describe("emailSchema", () => {
  it("accepts valid email", () => expect(ok(emailSchema, "user@example.com")).toBe(true));
  it("normalises email to lowercase", () => {
    const r = emailSchema.safeParse("User@Example.COM");
    expect(r.success && r.data).toBe("user@example.com");
  });
  it("rejects missing @", () => expect(ok(emailSchema, "notanemail")).toBe(false));
  it("rejects empty string", () => expect(ok(emailSchema, "")).toBe(false));
});

// ─── passwordSchema ───────────────────────────────────────────────────────────
describe("passwordSchema", () => {
  const VALID = "Secret1@";
  it("accepts a strong password", () => expect(ok(passwordSchema, VALID)).toBe(true));
  it("rejects password shorter than 8 chars", () =>
    expect(ok(passwordSchema, "Ab1!")).toBe(false));
  it("rejects password without uppercase", () =>
    expect(ok(passwordSchema, "secret1@")).toBe(false));
  it("rejects password without digit", () =>
    expect(ok(passwordSchema, "SecretAB@")).toBe(false));
  it("rejects password without special char (. ! @ #)", () =>
    expect(ok(passwordSchema, "Secret123")).toBe(false));
});

// ─── waNumberSchema ───────────────────────────────────────────────────────────
describe("waNumberSchema", () => {
  it("accepts Indonesian 08xx format and normalises to 628xx", () => {
    const r = waNumberSchema.safeParse("081234567890");
    expect(r.success && r.data).toBe("6281234567890");
  });
  it("accepts +62 format and strips leading +", () => {
    const r = waNumberSchema.safeParse("+6281234567890");
    expect(r.success && r.data).toBe("6281234567890");
  });
  it("accepts already-normalised 62xx format", () => {
    const r = waNumberSchema.safeParse("6281234567890");
    expect(r.success && r.data).toBe("6281234567890");
  });
  it("rejects number too short (< 8 chars)", () =>
    expect(ok(waNumberSchema, "0812")).toBe(false));
  it("rejects letters in number", () =>
    expect(ok(waNumberSchema, "081234ABCD")).toBe(false));
});

// ─── loginSchema ─────────────────────────────────────────────────────────────
describe("loginSchema", () => {
  const VALID = { email: "user@example.com", password: "anypassword123" };

  it("accepts valid credentials", () => expect(ok(loginSchema, VALID)).toBe(true));
  it("rejects invalid email format", () =>
    expect(ok(loginSchema, { ...VALID, email: "not-an-email" })).toBe(false));
  it("rejects empty password", () =>
    expect(ok(loginSchema, { ...VALID, password: "" })).toBe(false));
  it("rejects missing email field", () =>
    expect(ok(loginSchema, { password: "secret" })).toBe(false));
});

// ─── registerSchema ───────────────────────────────────────────────────────────
describe("registerSchema", () => {
  const VALID = {
    display_name: "John Doe",
    email: "john@example.com",
    password: "Secret1@",
    phone_wa: "081234567890",
  };

  it("accepts valid registration data", () => expect(ok(registerSchema, VALID)).toBe(true));
  it("rejects display_name shorter than 2 chars", () =>
    expect(ok(registerSchema, { ...VALID, display_name: "J" })).toBe(false));
  it("rejects display_name longer than 80 chars", () =>
    expect(ok(registerSchema, { ...VALID, display_name: "A".repeat(81) })).toBe(false));
  it("rejects invalid email", () =>
    expect(ok(registerSchema, { ...VALID, email: "bademail" })).toBe(false));
  it("rejects weak password (no special char)", () =>
    expect(ok(registerSchema, { ...VALID, password: "Password1" })).toBe(false));
  it("rejects invalid WA number", () =>
    expect(ok(registerSchema, { ...VALID, phone_wa: "abc" })).toBe(false));
});

// ─── forgotPasswordSchema ─────────────────────────────────────────────────────
describe("forgotPasswordSchema", () => {
  it("accepts valid email", () =>
    expect(ok(forgotPasswordSchema, { email: "user@example.com" })).toBe(true));
  it("rejects invalid email", () =>
    expect(ok(forgotPasswordSchema, { email: "notvalid" })).toBe(false));
  it("rejects empty email", () =>
    expect(ok(forgotPasswordSchema, { email: "" })).toBe(false));
});

// ─── resetPasswordSchema ──────────────────────────────────────────────────────
describe("resetPasswordSchema", () => {
  const VALID = { password: "Secret1@", confirmPassword: "Secret1@" };

  it("accepts matching strong passwords", () => expect(ok(resetPasswordSchema, VALID)).toBe(true));
  it("rejects when passwords do not match", () => {
    const r = resetPasswordSchema.safeParse({ password: "Secret1@", confirmPassword: "Other1@" });
    expect(r.success).toBe(false);
    expect(firstError(r)).toBe("Password tidak cocok");
  });
  it("rejects empty confirmPassword", () =>
    expect(ok(resetPasswordSchema, { password: "Secret1@", confirmPassword: "" })).toBe(false));
  it("rejects weak password in reset", () =>
    expect(ok(resetPasswordSchema, { password: "weakpass", confirmPassword: "weakpass" })).toBe(false));
});
