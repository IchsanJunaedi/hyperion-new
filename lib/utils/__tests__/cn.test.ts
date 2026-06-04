import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("merges multiple classes", () => {
    expect(cn("flex", "items-center", "gap-2")).toBe("flex items-center gap-2");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("removes conflicting padding classes", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("ignores falsy values", () => {
    expect(cn("flex", false, null, undefined, "gap-2")).toBe("flex gap-2");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });

  it("handles array inputs", () => {
    expect(cn(["flex", "items-center"])).toBe("flex items-center");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles empty string inputs without breaking", () => {
    expect(cn("", "flex", "")).toBe("flex");
  });

  it("merges hover + base variants correctly", () => {
    const result = cn("bg-white", "hover:bg-gray-100");
    expect(result).toBe("bg-white hover:bg-gray-100");
  });
});
