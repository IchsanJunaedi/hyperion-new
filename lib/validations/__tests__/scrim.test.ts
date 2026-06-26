import { describe, it, expect } from "vitest";
import {
  matchFormatSchema,
  createScrimSchema,
  submitResultSchema,
  updateAttendanceSchema,
  cancelScrimSchema,
  updateScrimSchema,
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

  it("accepts past scheduled_at (historical scrim)", () => {
    const pastIso = new Date(Date.now() - 86400000 * 7).toISOString();
    expect(createScrimSchema.safeParse({ ...valid, scheduled_at: pastIso }).success).toBe(true);
  });

  it("accepts optional patch field", () => {
    const r = createScrimSchema.safeParse({ ...valid, patch: "1.8.44" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.patch).toBe("1.8.44");
  });

  it("transforms empty patch to null", () => {
    const r = createScrimSchema.safeParse({ ...valid, patch: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.patch).toBeNull();
  });

  it("rejects patch longer than 30 chars", () => {
    const r = createScrimSchema.safeParse({ ...valid, patch: "a".repeat(31) });
    expect(r.success).toBe(false);
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

  it("transforms empty notes to null", () => {
    const r = submitResultSchema.safeParse({ ...valid, notes: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBeNull();
  });

  it("keeps non-empty notes", () => {
    const r = submitResultSchema.safeParse({ ...valid, notes: "Great game" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBe("Great game");
  });

  it("transforms empty result_image_path to null", () => {
    const r = submitResultSchema.safeParse({ ...valid, result_image_path: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.result_image_path).toBeNull();
  });

  it("keeps non-empty result_image_path", () => {
    const r = submitResultSchema.safeParse({ ...valid, result_image_path: "org-private/results/img.png" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.result_image_path).toBe("org-private/results/img.png");
  });
});

describe("cancelScrimSchema", () => {
  it("accepts valid scrim_id with no reason", () => {
    const result = cancelScrimSchema.safeParse({ scrim_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("accepts valid reason", () => {
    const result = cancelScrimSchema.safeParse({ scrim_id: VALID_UUID, reason: "Opponent unavailable" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reason).toBe("Opponent unavailable");
  });

  it("transforms empty reason to null", () => {
    const result = cancelScrimSchema.safeParse({ scrim_id: VALID_UUID, reason: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reason).toBeNull();
  });

  it("rejects reason longer than 500 chars", () => {
    const result = cancelScrimSchema.safeParse({ scrim_id: VALID_UUID, reason: "x".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid scrim_id", () => {
    const result = cancelScrimSchema.safeParse({ scrim_id: "not-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("updateScrimSchema", () => {
  const FUTURE_ISO = new Date(Date.now() + 86400000).toISOString();
  const valid = {
    scrim_id: VALID_UUID,
    division_id: VALID_UUID,
    opponent_name: "Tim Elang",
    scheduled_at: FUTURE_ISO,
    format: "bo3",
  };

  it("accepts valid full update input", () => {
    const result = updateScrimSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects empty opponent_name", () => {
    const result = updateScrimSchema.safeParse({ ...valid, opponent_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects opponent_name longer than 120 chars", () => {
    const result = updateScrimSchema.safeParse({ ...valid, opponent_name: "a".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid division_id", () => {
    const result = updateScrimSchema.safeParse({ ...valid, division_id: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid scheduled_at", () => {
    const result = updateScrimSchema.safeParse({ ...valid, scheduled_at: "invalid-date" });
    expect(result.success).toBe(false);
  });

  it("transforms empty opponent_contact to null", () => {
    const result = updateScrimSchema.safeParse({ ...valid, opponent_contact: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opponent_contact).toBeNull();
  });

  it("transforms empty server_region to null", () => {
    const result = updateScrimSchema.safeParse({ ...valid, server_region: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.server_region).toBeNull();
  });

  it("transforms empty room_info to null", () => {
    const result = updateScrimSchema.safeParse({ ...valid, room_info: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.room_info).toBeNull();
  });

  it("transforms empty notes to null", () => {
    const result = updateScrimSchema.safeParse({ ...valid, notes: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBeNull();
  });

  it("keeps non-empty notes", () => {
    const result = updateScrimSchema.safeParse({ ...valid, notes: "Watch the tower control" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe("Watch the tower control");
  });

  it("keeps non-empty server_region", () => {
    const result = updateScrimSchema.safeParse({ ...valid, server_region: "MY" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.server_region).toBe("MY");
  });

  it("keeps non-empty room_info", () => {
    const result = updateScrimSchema.safeParse({ ...valid, room_info: "Room 1234 / Pass: 5678" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.room_info).toBe("Room 1234 / Pass: 5678");
  });

  it("keeps non-empty opponent_contact", () => {
    const result = updateScrimSchema.safeParse({ ...valid, opponent_contact: "+62812345678" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opponent_contact).toBe("+62812345678");
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

  it("keeps non-empty note", () => {
    const r = updateAttendanceSchema.safeParse({
      scrim_id: VALID_UUID,
      status: "confirmed",
      note: "Will be late",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.note).toBe("Will be late");
  });
});
