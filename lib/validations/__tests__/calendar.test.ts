import { describe, it, expect } from "vitest";
import {
  eventTypeSchema,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from "@/lib/validations/calendar";

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("eventTypeSchema", () => {
  it.each(["tournament", "practice", "meeting", "bootcamp", "other"])(
    "accepts valid event type: %s",
    (type) => {
      expect(eventTypeSchema.safeParse(type).success).toBe(true);
    },
  );

  it("rejects 'scrim' (not a valid calendar event type)", () => {
    expect(eventTypeSchema.safeParse("scrim").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(eventTypeSchema.safeParse("").success).toBe(false);
  });
});

describe("createCalendarEventSchema", () => {
  const valid = {
    title: "Latihan Rutin",
    event_type: "practice",
    starts_at: "2026-05-20T19:00:00.000Z",
    visibility: "all",
  };

  it("accepts minimal event (only starts_at, no ends_at)", () => {
    expect(createCalendarEventSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts event where ends_at > starts_at", () => {
    const r = createCalendarEventSchema.safeParse({
      ...valid,
      ends_at: "2026-05-20T21:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("accepts event where ends_at = starts_at (same time)", () => {
    const r = createCalendarEventSchema.safeParse({
      ...valid,
      ends_at: "2026-05-20T19:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("rejects event where ends_at < starts_at", () => {
    const r = createCalendarEventSchema.safeParse({
      ...valid,
      ends_at: "2026-05-20T18:00:00.000Z",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("ends_at"))).toBe(true);
    }
  });

  it("accepts ends_at = null (optional field)", () => {
    const r = createCalendarEventSchema.safeParse({ ...valid, ends_at: null });
    expect(r.success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(createCalendarEventSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });

  it("rejects title longer than 200 chars", () => {
    expect(
      createCalendarEventSchema.safeParse({ ...valid, title: "a".repeat(201) }).success,
    ).toBe(false);
  });

  it.each(["private", "management", "coach_up", "all"])(
    "accepts visibility level: %s",
    (visibility) => {
      expect(createCalendarEventSchema.safeParse({ ...valid, visibility }).success).toBe(true);
    },
  );

  it("rejects invalid visibility level", () => {
    expect(
      createCalendarEventSchema.safeParse({ ...valid, visibility: "public" }).success,
    ).toBe(false);
  });

  it("accepts valid division_id UUID", () => {
    const r = createCalendarEventSchema.safeParse({ ...valid, division_id: VALID_UUID });
    expect(r.success).toBe(true);
  });
});

describe("updateCalendarEventSchema", () => {
  const valid = { id: VALID_UUID };

  it("accepts partial update with only id", () => {
    expect(updateCalendarEventSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts update with only title", () => {
    const r = updateCalendarEventSchema.safeParse({ ...valid, title: "Judul Baru" });
    expect(r.success).toBe(true);
  });

  it("accepts update with starts_at only (no ends_at)", () => {
    const r = updateCalendarEventSchema.safeParse({
      ...valid,
      starts_at: "2026-05-20T19:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("rejects when both starts_at and ends_at given and ends_at < starts_at", () => {
    const r = updateCalendarEventSchema.safeParse({
      ...valid,
      starts_at: "2026-05-20T20:00:00.000Z",
      ends_at: "2026-05-20T18:00:00.000Z",
    });
    expect(r.success).toBe(false);
  });

  it("accepts when starts_at and ends_at given and ends_at > starts_at", () => {
    const r = updateCalendarEventSchema.safeParse({
      ...valid,
      starts_at: "2026-05-20T18:00:00.000Z",
      ends_at: "2026-05-20T20:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-UUID id", () => {
    expect(updateCalendarEventSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });
});
