import { describe, it, expect } from "vitest";
import {
  waNumberSchema,
  passwordSchema,
  emailSchema,
  slugSchema,
} from "@/lib/validations/shared";

describe("waNumberSchema", () => {
  it("converts +6281234567890 to 6281234567890", () => {
    const r = waNumberSchema.safeParse("+6281234567890");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("6281234567890");
  });
  it("converts 081234567890 to 6281234567890", () => {
    const r = waNumberSchema.safeParse("081234567890");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("6281234567890");
  });
  it("keeps 6281234567890 unchanged", () => {
    const r = waNumberSchema.safeParse("6281234567890");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("6281234567890");
  });
  it("rejects number shorter than 8 digits", () => {
    expect(waNumberSchema.safeParse("0812").success).toBe(false);
  });
  it("rejects number with letters", () => {
    expect(waNumberSchema.safeParse("0812abc4567").success).toBe(false);
  });
  it("rejects number longer than 15 chars", () => {
    expect(waNumberSchema.safeParse("0" + "8".repeat(15)).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts valid password with uppercase, number, special char", () => {
    expect(passwordSchema.safeParse("SecurePass1!").success).toBe(true);
  });
  it("rejects password without uppercase letter", () => {
    const r = passwordSchema.safeParse("securepass1!");
    expect(r.success).toBe(false);
  });
  it("rejects password without number", () => {
    const r = passwordSchema.safeParse("SecurePass!!");
    expect(r.success).toBe(false);
  });
  it("rejects password without special char (. ! @ #)", () => {
    const r = passwordSchema.safeParse("SecurePass1A");
    expect(r.success).toBe(false);
  });
  it("rejects password shorter than 8 chars", () => {
    const r = passwordSchema.safeParse("Se1!");
    expect(r.success).toBe(false);
  });
  it("rejects password longer than 72 chars", () => {
    const r = passwordSchema.safeParse("A1!" + "a".repeat(71));
    expect(r.success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepts valid email and normalizes to lowercase", () => {
    const r = emailSchema.safeParse("User@Example.COM");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("user@example.com");
  });
  it("rejects string without @", () => {
    expect(emailSchema.safeParse("notanemail").success).toBe(false);
  });
  it("rejects string without domain", () => {
    expect(emailSchema.safeParse("user@").success).toBe(false);
  });
});

describe("slugSchema", () => {
  it("accepts valid kebab-case slug", () => {
    expect(slugSchema.safeParse("tim-garuda-2024").success).toBe(true);
  });
  it("normalizes slug with uppercase letters to lowercase", () => {
    const r = slugSchema.safeParse("Tim-Garuda");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("tim-garuda");
  });
  it("rejects slug starting with dash", () => {
    expect(slugSchema.safeParse("-tim-garuda").success).toBe(false);
  });
  it("rejects slug ending with dash", () => {
    expect(slugSchema.safeParse("tim-garuda-").success).toBe(false);
  });
  it("rejects slug shorter than 3 chars", () => {
    expect(slugSchema.safeParse("ab").success).toBe(false);
  });
});
