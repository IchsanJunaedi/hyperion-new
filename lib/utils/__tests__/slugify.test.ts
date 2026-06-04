import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("removes special characters", () => {
    expect(slugify("Juara 1 — MPL Season 15!")).toBe("juara-1-mpl-season-15");
  });
  it("collapses multiple hyphens", () => {
    expect(slugify("a  b   c")).toBe("a-b-c");
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });
  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});
