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
    expect(matchHero("Hlrara")).toBe("Hirara");
    expect(matchHero("  hirara ")).toBe("Hirara");
  });

  it("returns the raw trimmed string when nothing is close", () => {
    expect(matchHero("zzzzzzz")).toBe("zzzzzzz");
  });

  it("returns empty string for empty/whitespace input", () => {
    expect(matchHero("   ")).toBe("");
  });
});
