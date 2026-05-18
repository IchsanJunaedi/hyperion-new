import { describe, it, expect } from "vitest";
import { slugify, isValidSlug } from "@/lib/utils/slug";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("strips diacritics", () => {
    expect(slugify("Héllo Wörld")).toBe("hello-world");
  });
  it("replaces underscores with dashes", () => {
    expect(slugify("hello_world")).toBe("hello-world");
  });
  it("removes special characters", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });
  it("collapses repeated dashes", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });
  it("trims leading and trailing dashes", () => {
    expect(slugify("-hello-")).toBe("hello");
  });
  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
  it("handles already-valid slug", () => {
    expect(slugify("hello-world")).toBe("hello-world");
  });
  it("handles Indonesian team name with numbers", () => {
    expect(slugify("Tim Garuda 2024")).toBe("tim-garuda-2024");
  });
});

describe("isValidSlug", () => {
  it("accepts valid 3-char slug", () => {
    expect(isValidSlug("abc")).toBe(true);
  });
  it("accepts valid slug with dashes", () => {
    expect(isValidSlug("hello-world")).toBe(true);
  });
  it("accepts 32-char slug", () => {
    expect(isValidSlug("a" + "b".repeat(30) + "c")).toBe(true);
  });
  it("rejects 2-char slug (too short)", () => {
    expect(isValidSlug("ab")).toBe(false);
  });
  it("rejects slug starting with dash", () => {
    expect(isValidSlug("-hello")).toBe(false);
  });
  it("rejects slug ending with dash", () => {
    expect(isValidSlug("hello-")).toBe(false);
  });
  it("rejects uppercase", () => {
    expect(isValidSlug("Hello")).toBe(false);
  });
  it("rejects 33-char slug (too long)", () => {
    expect(isValidSlug("a" + "b".repeat(31) + "c")).toBe(false);
  });
});
