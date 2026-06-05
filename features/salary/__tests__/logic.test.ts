import { describe, it, expect } from "vitest";
import { computePayrollSpend } from "../logic";

describe("computePayrollSpend", () => {
  const now = new Date(2026, 5, 15); // 2026-06-15

  it("returns six month buckets ending with the current month", () => {
    const { monthlySpend } = computePayrollSpend([], now);
    expect(monthlySpend).toHaveLength(6);
    expect(monthlySpend[0]!.month).toBe("2026-01");
    expect(monthlySpend[5]!.month).toBe("2026-06");
    expect(monthlySpend[5]!.label).toBe("Jun");
  });

  it("sums only 'paid' payments into the right month", () => {
    const { monthlySpend, paidThisMonth } = computePayrollSpend(
      [
        { pay_period: "2026-06-01", amount: 1000, status: "paid" },
        { pay_period: "2026-06-20", amount: 500, status: "paid" },
        { pay_period: "2026-05-01", amount: 700, status: "paid" },
        { pay_period: "2026-06-05", amount: 999, status: "pending" }, // ignored
      ],
      now,
    );
    expect(paidThisMonth).toBe(1500);
    expect(monthlySpend[5]!.total).toBe(1500); // June
    expect(monthlySpend[4]!.total).toBe(700); // May
  });

  it("ignores payments outside the 6-month window", () => {
    const { monthlySpend } = computePayrollSpend(
      [{ pay_period: "2025-01-01", amount: 9999, status: "paid" }],
      now,
    );
    expect(monthlySpend.reduce((s, m) => s + m.total, 0)).toBe(0);
  });

  it("ignores rows with an unparseable pay_period", () => {
    const { paidThisMonth } = computePayrollSpend(
      [{ pay_period: "not-a-date", amount: 100, status: "paid" }],
      now,
    );
    expect(paidThisMonth).toBe(0);
  });
});
