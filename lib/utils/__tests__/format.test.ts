import { describe, it, expect } from "vitest";
import {
  normalizeWaNumber,
  formatDateTime,
  formatScrimSchedule,
  formatRelative,
} from "@/lib/utils/format";

describe("normalizeWaNumber", () => {
  it("converts 08xx to 628xx", () => {
    expect(normalizeWaNumber("081234567890")).toBe("6281234567890");
  });
  it("keeps 628xx unchanged", () => {
    expect(normalizeWaNumber("6281234567890")).toBe("6281234567890");
  });
  it("converts 8xx to 628xx", () => {
    expect(normalizeWaNumber("81234567890")).toBe("6281234567890");
  });
  it("strips non-digit chars before converting", () => {
    expect(normalizeWaNumber("0812-3456-7890")).toBe("6281234567890");
  });
  it("returns other numbers unchanged (no 0/62/8 prefix)", () => {
    expect(normalizeWaNumber("1234567890")).toBe("1234567890");
  });
});

describe("formatDateTime", () => {
  it("formats an ISO string and contains year and separator", () => {
    const result = formatDateTime("2026-05-18T13:00:00.000Z");
    expect(result).toContain("2026");
    expect(result).toContain("·");
  });
  it("formats a Date object", () => {
    const d = new Date("2026-12-25T10:00:00.000Z");
    const result = formatDateTime(d);
    expect(result).toContain("2026");
    expect(result).toContain("·");
  });
});

describe("formatScrimSchedule", () => {
  it("returns 'Hari ini' prefix for today", () => {
    const today = new Date();
    today.setHours(20, 0, 0, 0);
    expect(formatScrimSchedule(today).startsWith("Hari ini")).toBe(true);
  });
  it("returns 'Besok' prefix for tomorrow", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    expect(formatScrimSchedule(tomorrow).startsWith("Besok")).toBe(true);
  });
  it("returns date string with separator for other days", () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const result = formatScrimSchedule(nextWeek);
    expect(result).not.toContain("Hari ini");
    expect(result).not.toContain("Besok");
    expect(result).toContain("·");
  });
  it("accepts ISO string input", () => {
    const futureIso = new Date(Date.now() + 14 * 86400000).toISOString();
    const result = formatScrimSchedule(futureIso);
    expect(result).toContain("·");
  });
});

describe("formatRelative", () => {
  it("returns a relative time string for a past Date", () => {
    const past = new Date(Date.now() - 60000); // 1 minute ago
    const result = formatRelative(past);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts ISO string input", () => {
    const pastIso = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const result = formatRelative(pastIso);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
