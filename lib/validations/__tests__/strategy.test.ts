import { describe, it, expect } from "vitest";
import {
  visibilitySchema,
  createStrategyNoteSchema,
  updateStrategyNoteSchema,
} from "../strategy";

const VALID_UUID = "d3b07384-d113-4956-a5db-88a5b28d63cd";
const INVALID_UUID = "not-a-valid-uuid";

describe("visibilitySchema", () => {
  it.each(["public", "division", "private"])("accepts valid visibility: %s", (vis) => {
    expect(visibilitySchema.safeParse(vis).success).toBe(true);
  });

  it("rejects invalid visibility level", () => {
    expect(visibilitySchema.safeParse("team-only").success).toBe(false);
  });
});

describe("createStrategyNoteSchema", () => {
  const baseValid = {
    title: "Split Push Map Setup",
    content: "Langkah-langkah untuk melakukan split push di patch terbaru...",
  };

  it("accepts valid minimal input", () => {
    const result = createStrategyNoteSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Split Push Map Setup");
      expect(result.data.content).toBe("Langkah-langkah untuk melakukan split push di patch terbaru...");
      expect(result.data.division_id).toBeNull();
      expect(result.data.tags).toEqual([]);
      expect(result.data.visibility).toBe("division"); // default
    }
  });

  it("rejects empty title", () => {
    const result = createStrategyNoteSchema.safeParse({
      ...baseValid,
      title: "  ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title too long (> 200 chars)", () => {
    const result = createStrategyNoteSchema.safeParse({
      ...baseValid,
      title: "t".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = createStrategyNoteSchema.safeParse({
      ...baseValid,
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content too long (> 20000 chars)", () => {
    const result = createStrategyNoteSchema.safeParse({
      ...baseValid,
      content: "c".repeat(20001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid division_id UUID", () => {
    const result = createStrategyNoteSchema.safeParse({
      ...baseValid,
      division_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.division_id).toBe(VALID_UUID);
    }
  });

  it("rejects invalid division_id UUID", () => {
    const result = createStrategyNoteSchema.safeParse({
      ...baseValid,
      division_id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("transforms tags string into trimmed non-empty array", () => {
    const result = createStrategyNoteSchema.safeParse({
      ...baseValid,
      tags: " split-push, mobile-legends, , turtle-fight ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(["split-push", "mobile-legends", "turtle-fight"]);
    }
  });

  it("accepts explicitly provided visibility", () => {
    const result = createStrategyNoteSchema.safeParse({
      ...baseValid,
      visibility: "private",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visibility).toBe("private");
    }
  });
});

describe("updateStrategyNoteSchema", () => {
  const baseValidUpdate = {
    id: VALID_UUID,
    title: "Updated Title",
    content: "Updated content logic here.",
  };

  it("accepts valid update input", () => {
    const result = updateStrategyNoteSchema.safeParse(baseValidUpdate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(VALID_UUID);
      expect(result.data.title).toBe("Updated Title");
      expect(result.data.visibility).toBe("division");
      expect(result.data.tags).toEqual([]);
    }
  });

  it("rejects update without id", () => {
    const { id, ...missingId } = baseValidUpdate;
    const result = updateStrategyNoteSchema.safeParse(missingId);
    expect(result.success).toBe(false);
  });

  it("rejects update with invalid id UUID", () => {
    const result = updateStrategyNoteSchema.safeParse({
      ...baseValidUpdate,
      id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("transforms tags string and default visibility for update schema", () => {
    const result = updateStrategyNoteSchema.safeParse({
      ...baseValidUpdate,
      tags: "early-game, rotation",
      visibility: "public",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(["early-game", "rotation"]);
      expect(result.data.visibility).toBe("public");
    }
  });
});
