import { describe, it, expect } from "vitest";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "../announcement";

const VALID_UUID = "d3b07384-d113-4956-a5db-88a5b28d63cd";
const INVALID_UUID = "not-a-valid-uuid";

describe("createAnnouncementSchema", () => {
  const baseValid = {
    title: "Pengumuman Scrim Besok",
    body: "Harap berkumpul jam 19:00 WIB untuk persiapan scrim melawan Tim Elang.",
  };

  it("accepts valid minimal input", () => {
    const result = createAnnouncementSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Pengumuman Scrim Besok");
      expect(result.data.body).toBe("Harap berkumpul jam 19:00 WIB untuk persiapan scrim melawan Tim Elang.");
      expect(result.data.division_id).toBeNull();
      expect(result.data.is_pinned).toBe(false);
      expect(result.data.send_wa_blast).toBe(false);
    }
  });

  it("accepts valid full input", () => {
    const fullInput = {
      ...baseValid,
      division_id: VALID_UUID,
      is_pinned: true,
      send_wa_blast: true,
    };
    const result = createAnnouncementSchema.safeParse(fullInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.division_id).toBe(VALID_UUID);
      expect(result.data.is_pinned).toBe(true);
      expect(result.data.send_wa_blast).toBe(true);
    }
  });

  it("rejects empty title", () => {
    const result = createAnnouncementSchema.safeParse({
      ...baseValid,
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title too long (> 200 chars)", () => {
    const result = createAnnouncementSchema.safeParse({
      ...baseValid,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty body", () => {
    const result = createAnnouncementSchema.safeParse({
      ...baseValid,
      body: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects body too long (> 5000 chars)", () => {
    const result = createAnnouncementSchema.safeParse({
      ...baseValid,
      body: "b".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid division_id UUID", () => {
    const result = createAnnouncementSchema.safeParse({
      ...baseValid,
      division_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.division_id).toBe(VALID_UUID);
    }
  });

  it("rejects invalid division_id UUID", () => {
    const result = createAnnouncementSchema.safeParse({
      ...baseValid,
      division_id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("coerces values correctly", () => {
    const result = createAnnouncementSchema.safeParse({
      ...baseValid,
      is_pinned: "true",
      send_wa_blast: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_pinned).toBe(true);
      expect(result.data.send_wa_blast).toBe(true);
    }
  });

  it("defaults boolean fields correctly when omitted", () => {
    const result = createAnnouncementSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_pinned).toBe(false);
      expect(result.data.send_wa_blast).toBe(false);
    }
  });
});

describe("updateAnnouncementSchema", () => {
  const baseValidUpdate = {
    id: VALID_UUID,
    title: "Updated Title",
    body: "Updated announcement content.",
  };

  it("accepts valid update input", () => {
    const result = updateAnnouncementSchema.safeParse(baseValidUpdate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(VALID_UUID);
      expect(result.data.title).toBe("Updated Title");
      expect(result.data.body).toBe("Updated announcement content.");
      expect(result.data.is_pinned).toBe(false);
    }
  });

  it("rejects update without id", () => {
    const { id, ...missingId } = baseValidUpdate;
    const result = updateAnnouncementSchema.safeParse(missingId);
    expect(result.success).toBe(false);
  });

  it("rejects update with invalid id UUID", () => {
    const result = updateAnnouncementSchema.safeParse({
      ...baseValidUpdate,
      id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("coerces is_pinned correctly in update schema", () => {
    const result = updateAnnouncementSchema.safeParse({
      ...baseValidUpdate,
      is_pinned: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_pinned).toBe(true);
    }
  });
});
