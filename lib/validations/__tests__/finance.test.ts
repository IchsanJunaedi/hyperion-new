import { describe, it, expect } from "vitest";
import { createFinanceSchema } from "@/lib/validations/finance";

describe("createFinanceSchema", () => {
  const valid = {
    type: "income" as const,
    amount: 500000,
    category: "Iuran Member",
    date: "2026-05-01",
  };

  it("accepts valid income entry", () => {
    expect(createFinanceSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts valid expense entry", () => {
    expect(createFinanceSchema.safeParse({ ...valid, type: "expense" }).success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(createFinanceSchema.safeParse({ ...valid, type: "transfer" }).success).toBe(false);
  });

  it("rejects amount of 0 (must be positive)", () => {
    expect(createFinanceSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(createFinanceSchema.safeParse({ ...valid, amount: -100 }).success).toBe(false);
  });

  it("rejects float amount (must be integer)", () => {
    expect(createFinanceSchema.safeParse({ ...valid, amount: 100.5 }).success).toBe(false);
  });

  it("rejects empty category", () => {
    expect(createFinanceSchema.safeParse({ ...valid, category: "" }).success).toBe(false);
  });

  it("rejects invalid date string", () => {
    expect(createFinanceSchema.safeParse({ ...valid, date: "bukan-tanggal" }).success).toBe(false);
  });

  it("transforms empty description to null", () => {
    const r = createFinanceSchema.safeParse({ ...valid, description: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.description).toBeNull();
  });

  it("keeps non-empty description", () => {
    const r = createFinanceSchema.safeParse({ ...valid, description: "Iuran Mei" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.description).toBe("Iuran Mei");
  });

  it("coerces string amount to number", () => {
    const r = createFinanceSchema.safeParse({ ...valid, amount: "250000" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.amount).toBe(250000);
  });
});
