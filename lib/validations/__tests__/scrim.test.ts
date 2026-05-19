import { describe, it, expect } from "vitest";
import {
  matchFormatSchema,
  createScrimSchema,
  submitResultSchema,
  updateAttendanceSchema,
} from "@/lib/validations/scrim";

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const FUTURE_ISO = new Date(Date.now() + 86400000).toISOString(); // tomorrow

describe("matchFormatSchema", () => {
  it.each(["bo1", "bo2", "bo3", "bo5", "bo7", "4match"])(
    "accepts valid format: %s",
    (format) => {
      expect(matchFormatSchema.safeParse(format).success).toBe(true);
    },
  );
  it("rejects 'scrimmage' (removed format)", () => {
    expect(matchFormatSchema.safeParse("scrimmage").success).toBe(false);
  });
  it("rejects unknown format 'bo4'", () => {
    expect(matchFormatSchema.safeParse("bo4").success).toBe(false);
  });
});

describe("createScrimSchema", () => {
  const valid = {
    division_id: VALID_UUID,
    opponent_name: "Tim Elang",
    scheduled_at: FUTURE_ISO,
    format: "bo3",
  };

  it("accepts valid minimal input", () => {
    expect(createScrimSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty opponent_name", () => {
    expect(createScrimSchema.safeParse({ ...valid, opponent_name: "" }).success).toBe(false);
  });

  it("rejects opponent_name longer than 120 chars", () => {
    expect(
      createScrimSchema.safeParse({ ...valid, opponent_name: "a".repeat(121) }).success,
    ).toBe(false);
  });

  it("rejects non-UUID division_id", () => {
    expect(createScrimSchema.safeParse({ ...valid, division_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects non-date scheduled_at", () => {
    expect(createScrimSchema.safeParse({ ...valid, scheduled_at: "bukan-iso" }).success).toBe(false);
  });

  it("transforms empty server_region to null", () => {
    const r = createScrimSchema.safeParse({ ...valid, server_region: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.server_region).toBeNull();
  });

  it("transforms empty room_info to null", () => {
    const r = createScrimSchema.safeParse({ ...valid, room_info: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.room_info).toBeNull();
  });

  it("keeps non-empty notes", () => {
    const r = createScrimSchema.safeParse({ ...valid, notes: "Pakai patch terbaru" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBe("Pakai patch terbaru");
  });
});

describe("submitResultSchema", () => {
  const valid = {
    scrim_id: VALID_UUID,
    our_score: 2,
    opponent_score: 1,
    is_win: true,
  };

  it("accepts valid result", () => {
    expect(submitResultSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects our_score above 5", () => {
    expect(submitResultSchema.safeParse({ ...valid, our_score: 6 }).success).toBe(false);
  });

  it("rejects our_score below 0", () => {
    expect(submitResultSchema.safeParse({ ...valid, our_score: -1 }).success).toBe(false);
  });

  it("rejects performance_rating of 0 (min is 1)", () => {
    expect(submitResultSchema.safeParse({ ...valid, performance_rating: 0 }).success).toBe(false);
  });

  it("rejects performance_rating of 6 (max is 5)", () => {
    expect(submitResultSchema.safeParse({ ...valid, performance_rating: 6 }).success).toBe(false);
  });

  it("accepts performance_rating of 5", () => {
    expect(submitResultSchema.safeParse({ ...valid, performance_rating: 5 }).success).toBe(true);
  });

  it("accepts performance_rating of 1", () => {
    expect(submitResultSchema.safeParse({ ...valid, performance_rating: 1 }).success).toBe(true);
  });
});

describe("updateAttendanceSchema", () => {
  it.each(["confirmed", "declined", "tentative", "pending"])(
    "accepts valid status: %s",
    (status) => {
      const r = updateAttendanceSchema.safeParse({ scrim_id: VALID_UUID, status });
      expect(r.success).toBe(true);
    },
  );

  it("rejects invalid status 'maybe'", () => {
    expect(
      updateAttendanceSchema.safeParse({ scrim_id: VALID_UUID, status: "maybe" }).success,
    ).toBe(false);
  });

  it("transforms empty note to null", () => {
    const r = updateAttendanceSchema.safeParse({
      scrim_id: VALID_UUID,
      status: "confirmed",
      note: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.note).toBeNull();
  });
});
