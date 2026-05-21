import { describe, it, expect } from "vitest";
import { createPollSchema, votePollSchema } from "../poll";

const VALID_UUID = "d3b07384-d113-4956-a5db-88a5b28d63cd";
const INVALID_UUID = "not-a-valid-uuid";

describe("createPollSchema", () => {
  const baseValid = {
    question: "Siapa MVP scrim hari ini?",
    options: ["Player A", "Player B"],
  };

  it("accepts valid minimal input", () => {
    const result = createPollSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.question).toBe("Siapa MVP scrim hari ini?");
      expect(result.data.options).toEqual(["Player A", "Player B"]);
      expect(result.data.expires_at).toBeNull();
    }
  });

  it("accepts valid input with maximum allowed options (10)", () => {
    const input = {
      ...baseValid,
      options: Array.from({ length: 10 }, (_, i) => `Option ${i + 1}`),
    };
    const result = createPollSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.options.length).toBe(10);
    }
  });

  it("accepts valid expires_at", () => {
    const input = {
      ...baseValid,
      expires_at: "2026-06-01T12:00:00.000Z",
    };
    const result = createPollSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expires_at).toBe("2026-06-01T12:00:00.000Z");
    }
  });

  it("rejects empty question", () => {
    const result = createPollSchema.safeParse({
      ...baseValid,
      question: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects question too long (> 500 chars)", () => {
    const result = createPollSchema.safeParse({
      ...baseValid,
      question: "q".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects 1 option (min is 2)", () => {
    const result = createPollSchema.safeParse({
      ...baseValid,
      options: ["Only one"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects 11 options (max is 10)", () => {
    const result = createPollSchema.safeParse({
      ...baseValid,
      options: Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`),
    });
    expect(result.success).toBe(false);
  });

  it("rejects option that is an empty string", () => {
    const result = createPollSchema.safeParse({
      ...baseValid,
      options: ["Option A", ""],
    });
    expect(result.success).toBe(false);
  });

  it("rejects option that contains only spaces", () => {
    const result = createPollSchema.safeParse({
      ...baseValid,
      options: ["Option A", "    "],
    });
    expect(result.success).toBe(false);
  });

  it("transforms empty expires_at to null", () => {
    const result = createPollSchema.safeParse({
      ...baseValid,
      expires_at: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expires_at).toBeNull();
    }
  });

  it("rejects non-array options", () => {
    const result = createPollSchema.safeParse({
      ...baseValid,
      options: "Option A, Option B" as any,
    });
    expect(result.success).toBe(false);
  });
});

describe("votePollSchema", () => {
  const baseValidVote = {
    poll_id: VALID_UUID,
    option_index: 0,
  };

  it("accepts valid vote at index 0", () => {
    const result = votePollSchema.safeParse(baseValidVote);
    expect(result.success).toBe(true);
  });

  it("accepts valid vote at a positive index", () => {
    const result = votePollSchema.safeParse({
      ...baseValidVote,
      option_index: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid poll_id UUID", () => {
    const result = votePollSchema.safeParse({
      ...baseValidVote,
      poll_id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative option_index", () => {
    const result = votePollSchema.safeParse({
      ...baseValidVote,
      option_index: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects float option_index", () => {
    const result = votePollSchema.safeParse({
      ...baseValidVote,
      option_index: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing poll_id", () => {
    const { poll_id, ...missingId } = baseValidVote;
    const result = votePollSchema.safeParse(missingId);
    expect(result.success).toBe(false);
  });

  it("rejects missing option_index", () => {
    const { option_index, ...missingIndex } = baseValidVote;
    const result = votePollSchema.safeParse(missingIndex);
    expect(result.success).toBe(false);
  });
});
