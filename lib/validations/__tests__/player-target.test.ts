import { describe, it, expect } from "vitest";
import {
  createPlayerTargetSchema,
  updatePlayerTargetSchema,
} from "../player-target";

const VALID_UUID = "d3b07384-d113-4956-a5db-88a5b28d63cd";
const INVALID_UUID = "not-a-valid-uuid";

describe("createPlayerTargetSchema", () => {
  const baseValid = {
    user_id: VALID_UUID,
    skill_name: "Laning Phase Mechanics",
    target_level: 8,
  };

  it("accepts valid minimal input", () => {
    const result = createPlayerTargetSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user_id).toBe(VALID_UUID);
      expect(result.data.skill_name).toBe("Laning Phase Mechanics");
      expect(result.data.target_level).toBe(8);
      expect(result.data.current_level).toBe(1); // default
      expect(result.data.notes).toBeNull(); // transforms undefined to null
    }
  });

  it("accepts valid full input", () => {
    const fullInput = {
      ...baseValid,
      current_level: 5,
      notes: "Perlu meningkatkan last-hit under tower.",
    };
    const result = createPlayerTargetSchema.safeParse(fullInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.current_level).toBe(5);
      expect(result.data.notes).toBe("Perlu meningkatkan last-hit under tower.");
    }
  });

  it("rejects empty skill_name", () => {
    const result = createPlayerTargetSchema.safeParse({
      ...baseValid,
      skill_name: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects skill_name too long (> 100 chars)", () => {
    const result = createPlayerTargetSchema.safeParse({
      ...baseValid,
      skill_name: "s".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid target_level range (< 1)", () => {
    const result = createPlayerTargetSchema.safeParse({
      ...baseValid,
      target_level: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid target_level range (> 10)", () => {
    const result = createPlayerTargetSchema.safeParse({
      ...baseValid,
      target_level: 11,
    });
    expect(result.success).toBe(false);
  });

  it("rejects float target_level", () => {
    const result = createPlayerTargetSchema.safeParse({
      ...baseValid,
      target_level: 5.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid user_id UUID", () => {
    const result = createPlayerTargetSchema.safeParse({
      ...baseValid,
      user_id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("coerces target_level and current_level strings to numbers", () => {
    const result = createPlayerTargetSchema.safeParse({
      ...baseValid,
      target_level: "9",
      current_level: "3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.target_level).toBe(9);
      expect(result.data.current_level).toBe(3);
    }
  });

  it("transforms empty notes to null", () => {
    const result = createPlayerTargetSchema.safeParse({
      ...baseValid,
      notes: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeNull();
    }
  });
});

describe("updatePlayerTargetSchema", () => {
  const baseValidUpdate = {
    target_id: VALID_UUID,
    current_level: 6,
  };

  it("accepts valid update input", () => {
    const result = updatePlayerTargetSchema.safeParse(baseValidUpdate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.target_id).toBe(VALID_UUID);
      expect(result.data.current_level).toBe(6);
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects update without target_id", () => {
    const { target_id, ...missingId } = baseValidUpdate;
    const result = updatePlayerTargetSchema.safeParse(missingId);
    expect(result.success).toBe(false);
  });

  it("rejects update with invalid target_id UUID", () => {
    const result = updatePlayerTargetSchema.safeParse({
      ...baseValidUpdate,
      target_id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects current_level range (< 1) in update", () => {
    const result = updatePlayerTargetSchema.safeParse({
      ...baseValidUpdate,
      current_level: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects current_level range (> 10) in update", () => {
    const result = updatePlayerTargetSchema.safeParse({
      ...baseValidUpdate,
      current_level: 11,
    });
    expect(result.success).toBe(false);
  });

  it("transforms empty notes to null in update schema", () => {
    const result = updatePlayerTargetSchema.safeParse({
      ...baseValidUpdate,
      notes: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeNull();
    }
  });
});
