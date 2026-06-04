import { describe, it, expect } from "vitest";
import {
  opponentProfileDataSchema,
  createOpponentProfileSchema,
  updateOpponentProfileSchema,
} from "../scouting";

const VALID_UUID = "d3b07384-d113-4956-a5db-88a5b28d63cd";

describe("opponentProfileDataSchema", () => {
  it("accepts empty object (all optional)", () => {
    expect(opponentProfileDataSchema.safeParse({}).success).toBe(true);
  });

  it("accepts full valid input", () => {
    const result = opponentProfileDataSchema.safeParse({
      team_name: "Team Alpha",
      usernames: ["alpha1", "alpha2"],
      high_rank: "Mythic",
      current_rank: "Legend",
      hero_pool: ["Layla", "Saber"],
      playstyle: "Aggressive early game",
      weaknesses: "Weak to split push",
      notes: "Beware of their jungler",
    });
    expect(result.success).toBe(true);
  });

  it("rejects team_name exceeding 200 chars", () => {
    expect(opponentProfileDataSchema.safeParse({ team_name: "x".repeat(201) }).success).toBe(false);
  });

  it("rejects playstyle exceeding 1000 chars", () => {
    expect(opponentProfileDataSchema.safeParse({ playstyle: "x".repeat(1001) }).success).toBe(false);
  });

  it("rejects notes exceeding 2000 chars", () => {
    expect(opponentProfileDataSchema.safeParse({ notes: "x".repeat(2001) }).success).toBe(false);
  });

  it("trims whitespace from string fields", () => {
    const result = opponentProfileDataSchema.safeParse({ team_name: "  Alpha  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.team_name).toBe("Alpha");
  });
});

describe("createOpponentProfileSchema", () => {
  const base = { opponent_name: "Team Rival" };

  it("accepts valid minimal input", () => {
    expect(createOpponentProfileSchema.safeParse(base).success).toBe(true);
  });

  it("rejects empty opponent_name", () => {
    expect(createOpponentProfileSchema.safeParse({ opponent_name: "" }).success).toBe(false);
  });

  it("rejects opponent_name exceeding 200 chars", () => {
    expect(createOpponentProfileSchema.safeParse({ opponent_name: "x".repeat(201) }).success).toBe(false);
  });

  it("accepts with optional data field", () => {
    const result = createOpponentProfileSchema.safeParse({
      ...base,
      data: { team_name: "The Rivals", hero_pool: ["Tigreal"] },
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from opponent_name", () => {
    const result = createOpponentProfileSchema.safeParse({ opponent_name: "  Rival Team  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opponent_name).toBe("Rival Team");
  });
});

describe("updateOpponentProfileSchema", () => {
  const base = { profile_id: VALID_UUID, opponent_name: "Team Rival" };

  it("accepts valid input", () => {
    expect(updateOpponentProfileSchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid profile_id UUID", () => {
    expect(updateOpponentProfileSchema.safeParse({ ...base, profile_id: "not-uuid" }).success).toBe(false);
  });

  it("rejects empty opponent_name", () => {
    expect(updateOpponentProfileSchema.safeParse({ ...base, opponent_name: "" }).success).toBe(false);
  });

  it("accepts with optional data field", () => {
    const result = updateOpponentProfileSchema.safeParse({
      ...base,
      data: { notes: "Updated notes" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing profile_id", () => {
    expect(updateOpponentProfileSchema.safeParse({ opponent_name: "Rival" }).success).toBe(false);
  });
});
