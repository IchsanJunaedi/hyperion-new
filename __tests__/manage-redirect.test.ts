// __tests__/manage-redirect.test.ts
import { describe, it, expect } from "vitest";

function pickFirstSlug(
  orgs: Array<{ id: string; slug: string }>
): string | null {
  return orgs[0]?.slug ?? null;
}

describe("pickFirstSlug", () => {
  it("returns null when no orgs", () => {
    expect(pickFirstSlug([])).toBeNull();
  });
  it("returns first org slug", () => {
    expect(
      pickFirstSlug([
        { id: "a", slug: "rrq" },
        { id: "b", slug: "evos" },
      ])
    ).toBe("rrq");
  });
});
