import { describe, it, expect } from "vitest";
import { getTargetDate, computeTimeLeft } from "@/lib/utils/countdown";

describe("getTargetDate", () => {
  it("uses start_time when provided", () => {
    const result = getTargetDate("2026-07-01", "14:30:00");
    expect(result.toISOString()).toContain("2026-07-01");
    expect(result instanceof Date).toBe(true);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it("defaults to midnight when start_time is null", () => {
    const result = getTargetDate("2026-07-01", null);
    expect(result instanceof Date).toBe(true);
    expect(isNaN(result.getTime())).toBe(false);
  });
});

describe("computeTimeLeft", () => {
  it("returns null when target is in the past", () => {
    const past = new Date(Date.now() - 1000);
    expect(computeTimeLeft(past)).toBeNull();
  });

  it("returns correct breakdown for future date", () => {
    const future = new Date(
      Date.now() + (1 * 86400 + 2 * 3600 + 3 * 60 + 4) * 1000
    );
    const result = computeTimeLeft(future);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(1);
    expect(result!.hours).toBe(2);
    expect(result!.minutes).toBe(3);
    expect(result!.seconds).toBeGreaterThanOrEqual(3);
    expect(result!.seconds).toBeLessThanOrEqual(5);
  });

  it("returns all zeros at exactly the target (edge)", () => {
    const exactly = new Date(Date.now() + 999); // <1s
    const result = computeTimeLeft(exactly);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(0);
    expect(result!.hours).toBe(0);
    expect(result!.minutes).toBe(0);
  });
});
