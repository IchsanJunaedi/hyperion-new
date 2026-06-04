import { describe, it, expect } from "vitest";
import {
  createTournamentSchema,
  updateTournamentSchema,
  createTournamentStageSchema,
} from "../tournament";

const VALID_UUID = "d3b07384-d113-4956-a5db-88a5b28d63cd";
const INVALID_UUID = "not-a-valid-uuid";

describe("createTournamentSchema", () => {
  const baseValid = {
    division_id: VALID_UUID,
    name: "Tournament Championship",
    start_date: "2026-06-01",
    registration_deadline: "2026-05-30T23:59:00.000Z",
  };

  it("accepts valid minimal input", () => {
    const result = createTournamentSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.division_id).toBe(VALID_UUID);
      expect(result.data.name).toBe("Tournament Championship");
      expect(result.data.start_date).toBe("2026-06-01");
      expect(result.data.organizer).toBeNull(); // transforms undefined to null
    }
  });

  it("accepts valid full input", () => {
    const fullInput = {
      ...baseValid,
      organizer: "Moonton",
      end_date: "2026-06-05",
      prize_pool: "$10,000",
      registration_fee: "$50",
      registration_url: "https://example.com/register",
      notes: "Some rules here",
      start_time: "14:30",
    };
    const result = createTournamentSchema.safeParse(fullInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.organizer).toBe("Moonton");
      expect(result.data.end_date).toBe("2026-06-05");
      expect(result.data.prize_pool).toBe("$10,000");
      expect(result.data.start_time).toBe("14:30");
    }
  });

  it("rejects empty name", () => {
    const result = createTournamentSchema.safeParse({
      ...baseValid,
      name: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name too long (> 200 chars)", () => {
    const result = createTournamentSchema.safeParse({
      ...baseValid,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID division_id", () => {
    const result = createTournamentSchema.safeParse({
      ...baseValid,
      division_id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("transforms empty fields to null", () => {
    const input = {
      ...baseValid,
      organizer: "",
      end_date: "",
      prize_pool: "  ",
      registration_fee: "",
      registration_url: "",
      notes: "",
      // start_time is omitted to test transform of undefined/optional to null
      // because passing "" fails the regex /^\d{2}:\d{2}$/ first.
    };
    const result = createTournamentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.organizer).toBeNull();
      expect(result.data.end_date).toBeNull();
      expect(result.data.prize_pool).toBeNull();
      expect(result.data.registration_fee).toBeNull();
      expect(result.data.registration_url).toBeNull();
      expect(result.data.notes).toBeNull();
      expect(result.data.start_time).toBeNull();
    }
  });

  it("accepts valid start_time format (HH:MM)", () => {
    const result = createTournamentSchema.safeParse({
      ...baseValid,
      start_time: "09:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid start_time format", () => {
    const result = createTournamentSchema.safeParse({
      ...baseValid,
      start_time: "9:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateTournamentSchema", () => {
  const baseValidUpdate = {
    tournament_id: VALID_UUID,
    division_id: VALID_UUID,
    name: "Updated Championship",
    start_date: "2026-06-01",
    registration_deadline: "2026-05-30T23:59:00.000Z",
  };

  it("accepts valid update input", () => {
    const result = updateTournamentSchema.safeParse(baseValidUpdate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tournament_id).toBe(VALID_UUID);
    }
  });

  it("rejects update without tournament_id", () => {
    const { tournament_id, ...missingId } = baseValidUpdate;
    const result = updateTournamentSchema.safeParse(missingId);
    expect(result.success).toBe(false);
  });

  it("rejects update with invalid tournament_id UUID", () => {
    const result = updateTournamentSchema.safeParse({
      ...baseValidUpdate,
      tournament_id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });
});

describe("createTournamentStageSchema", () => {
  const baseStageValid = {
    tournament_id: VALID_UUID,
    stage_name: "Group Stage",
    scheduled_at: "2026-06-01T15:00:00.000Z",
  };

  it("accepts valid stage input", () => {
    const result = createTournamentStageSchema.safeParse(baseStageValid);
    expect(result.success).toBe(true);
  });

  it("rejects empty stage_name", () => {
    const result = createTournamentStageSchema.safeParse({
      ...baseStageValid,
      stage_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects stage_name too long (> 200 chars)", () => {
    const result = createTournamentStageSchema.safeParse({
      ...baseStageValid,
      stage_name: "s".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid tournament_id UUID", () => {
    const result = createTournamentStageSchema.safeParse({
      ...baseStageValid,
      tournament_id: INVALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("transforms empty stage notes to null", () => {
    const result = createTournamentStageSchema.safeParse({
      ...baseStageValid,
      notes: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects empty scheduled_at", () => {
    const result = createTournamentStageSchema.safeParse({
      ...baseStageValid,
      scheduled_at: "",
    });
    expect(result.success).toBe(false);
  });
});
