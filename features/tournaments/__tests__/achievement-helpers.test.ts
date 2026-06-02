import { describe, it, expect } from "vitest";
import {
  shouldAutoCreateAchievement,
  buildAchievementTitle,
} from "../achievement-helpers";

describe("shouldAutoCreateAchievement", () => {
  it("returns true for placement 1", () => {
    expect(shouldAutoCreateAchievement(1)).toBe(true);
  });
  it("returns true for placement 2", () => {
    expect(shouldAutoCreateAchievement(2)).toBe(true);
  });
  it("returns true for placement 3", () => {
    expect(shouldAutoCreateAchievement(3)).toBe(true);
  });
  it("returns false for placement 4", () => {
    expect(shouldAutoCreateAchievement(4)).toBe(false);
  });
  it("returns false for null", () => {
    expect(shouldAutoCreateAchievement(null)).toBe(false);
  });
  it("returns false for undefined", () => {
    expect(shouldAutoCreateAchievement(undefined)).toBe(false);
  });
});

describe("buildAchievementTitle", () => {
  it("formats placement 1 correctly", () => {
    expect(buildAchievementTitle(1, "Piala Presiden 2026")).toBe(
      "Juara 1 — Piala Presiden 2026"
    );
  });
  it("formats placement 3 correctly", () => {
    expect(buildAchievementTitle(3, "MLBB Regional Cup")).toBe(
      "Juara 3 — MLBB Regional Cup"
    );
  });
});
