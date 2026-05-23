import { describe, it, expect } from "vitest";
import { createScrimRequestSchema, respondScrimRequestSchema } from "../matchmaking";

const VALID_UUID = "d3b07384-d113-4956-a5db-88a5b28d63cd";
const INVALID_UUID = "not-a-uuid";

describe("createScrimRequestSchema", () => {
  const baseValid = {
    to_org_id: VALID_UUID,
    division_id: VALID_UUID,
    format: "bo3" as const,
  };

  it("accepts valid minimal input", () => {
    const result = createScrimRequestSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
  });

  it("accepts all valid format values", () => {
    for (const format of ["bo1", "bo3", "bo5", "scrimmage"] as const) {
      const result = createScrimRequestSchema.safeParse({ ...baseValid, format });
      expect(result.success).toBe(true);
    }
  });

  it("defaults format to bo3 when not provided", () => {
    const { format, ...withoutFormat } = baseValid;
    const result = createScrimRequestSchema.safeParse(withoutFormat);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("bo3");
    }
  });

  it("rejects invalid to_org_id", () => {
    const result = createScrimRequestSchema.safeParse({ ...baseValid, to_org_id: INVALID_UUID });
    expect(result.success).toBe(false);
  });

  it("rejects invalid division_id", () => {
    const result = createScrimRequestSchema.safeParse({ ...baseValid, division_id: INVALID_UUID });
    expect(result.success).toBe(false);
  });

  it("rejects invalid format value", () => {
    const result = createScrimRequestSchema.safeParse({ ...baseValid, format: "bo7" });
    expect(result.success).toBe(false);
  });

  it("transforms empty message to null", () => {
    const result = createScrimRequestSchema.safeParse({ ...baseValid, message: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBeNull();
    }
  });

  it("accepts message within 500 chars", () => {
    const result = createScrimRequestSchema.safeParse({ ...baseValid, message: "Hello!" });
    expect(result.success).toBe(true);
  });

  it("rejects message exceeding 500 chars", () => {
    const result = createScrimRequestSchema.safeParse({
      ...baseValid,
      message: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("transforms empty preferred_time to null", () => {
    const result = createScrimRequestSchema.safeParse({ ...baseValid, preferred_time: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferred_time).toBeNull();
    }
  });
});

describe("respondScrimRequestSchema", () => {
  it("accepts accepted status", () => {
    const result = respondScrimRequestSchema.safeParse({
      request_id: VALID_UUID,
      status: "accepted",
    });
    expect(result.success).toBe(true);
  });

  it("accepts declined status", () => {
    const result = respondScrimRequestSchema.safeParse({
      request_id: VALID_UUID,
      status: "declined",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid request_id", () => {
    const result = respondScrimRequestSchema.safeParse({
      request_id: INVALID_UUID,
      status: "accepted",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status value", () => {
    const result = respondScrimRequestSchema.safeParse({
      request_id: VALID_UUID,
      status: "pending",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing request_id", () => {
    const result = respondScrimRequestSchema.safeParse({ status: "accepted" });
    expect(result.success).toBe(false);
  });

  it("rejects missing status", () => {
    const result = respondScrimRequestSchema.safeParse({ request_id: VALID_UUID });
    expect(result.success).toBe(false);
  });
});
