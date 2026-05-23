/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { summarizeAttendance, getScrimWinLossRecord, listScrims } from "../queries";
import { createClient } from "@/lib/supabase/server";
import type { ScrimDetail } from "../queries";

// Stub the server-only module
vi.mock("server-only", () => ({}));

type AttendanceRow = ScrimDetail["attendances"][number];
type AttStatus = "confirmed" | "declined" | "tentative" | "pending";

const makeRow = (userId: string, status: AttStatus): AttendanceRow => ({
  attendance: { status } as AttendanceRow["attendance"],
  member: {
    user_id: userId,
    display_name: `Player ${userId}`,
    avatar_url: null,
    jersey_number: null,
    position: null,
  },
});

describe("summarizeAttendance", () => {
  it("returns all zeros for empty array", () => {
    const result = summarizeAttendance([]);
    expect(result).toEqual({ confirmed: 0, declined: 0, tentative: 0, pending: 0 });
  });

  it("counts a single confirmed attendance", () => {
    const result = summarizeAttendance([makeRow("u1", "confirmed")]);
    expect(result).toEqual({ confirmed: 1, declined: 0, tentative: 0, pending: 0 });
  });

  it("counts a single declined attendance", () => {
    const result = summarizeAttendance([makeRow("u1", "declined")]);
    expect(result).toEqual({ confirmed: 0, declined: 1, tentative: 0, pending: 0 });
  });

  it("counts a single tentative attendance", () => {
    const result = summarizeAttendance([makeRow("u1", "tentative")]);
    expect(result).toEqual({ confirmed: 0, declined: 0, tentative: 1, pending: 0 });
  });

  it("counts a single pending attendance", () => {
    const result = summarizeAttendance([makeRow("u1", "pending")]);
    expect(result).toEqual({ confirmed: 0, declined: 0, tentative: 0, pending: 1 });
  });

  it("counts mixed statuses correctly", () => {
    const rows = [
      makeRow("u1", "confirmed"),
      makeRow("u2", "confirmed"),
      makeRow("u3", "declined"),
      makeRow("u4", "tentative"),
      makeRow("u5", "pending"),
      makeRow("u6", "pending"),
    ];
    const result = summarizeAttendance(rows);
    expect(result).toEqual({ confirmed: 2, declined: 1, tentative: 1, pending: 2 });
  });

  it("total count equals number of attendances", () => {
    const rows = [
      makeRow("u1", "confirmed"),
      makeRow("u2", "declined"),
      makeRow("u3", "tentative"),
    ];
    const result = summarizeAttendance(rows);
    const total = result.confirmed + result.declined + result.tentative + result.pending;
    expect(total).toBe(3);
  });

  it("handles duplicate users with different statuses", () => {
    const rows = [
      makeRow("u1", "confirmed"),
      makeRow("u1", "declined"),
    ];
    const result = summarizeAttendance(rows);
    expect(result.confirmed).toBe(1);
    expect(result.declined).toBe(1);
  });
});

describe("getScrimWinLossRecord", () => {
  let mockFrom: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockFrom),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns all zeros when no scrims are found", async () => {
    mockFrom.then = vi.fn((resolve) => resolve({ data: [], error: null }));

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 0, losses: 0, draws: 0, total: 0 });
  });

  it("returns all zeros when database error occurs", async () => {
    mockFrom.then = vi.fn((resolve) => resolve({ data: null, error: { message: "Error" } }));

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 0, losses: 0, draws: 0, total: 0 });
  });

  it("counts wins correctly when all are wins", async () => {
    const dbData = [
      { id: "1", scrim_results: [{ is_win: true }] },
      { id: "2", scrim_results: [{ is_win: true }] },
    ];
    mockFrom.then = vi.fn((resolve) => resolve({ data: dbData, error: null }));

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 2, losses: 0, draws: 0, total: 2 });
  });

  it("counts losses correctly when all are losses", async () => {
    const dbData = [
      { id: "1", scrim_results: [{ is_win: false }] },
    ];
    mockFrom.then = vi.fn((resolve) => resolve({ data: dbData, error: null }));

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 0, losses: 1, draws: 0, total: 1 });
  });

  it("counts draws correctly when all are draws", async () => {
    const dbData = [
      { id: "1", scrim_results: [{ is_win: null }] },
      { id: "2", scrim_results: [{ is_win: undefined }] },
    ];
    mockFrom.then = vi.fn((resolve) => resolve({ data: dbData, error: null }));

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 0, losses: 0, draws: 2, total: 2 });
  });

  it("counts mixed wins, losses, and draws correctly", async () => {
    const dbData = [
      { id: "1", scrim_results: [{ is_win: true }] },
      { id: "2", scrim_results: [{ is_win: false }] },
      { id: "3", scrim_results: [{ is_win: null }] },
      { id: "4", scrim_results: [{ is_win: undefined }] },
    ];
    mockFrom.then = vi.fn((resolve) => resolve({ data: dbData, error: null }));

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 1, losses: 1, draws: 2, total: 4 });
  });

  it("handles scrim_results as a single object (non-array fallback)", async () => {
    const dbData = [
      { id: "1", scrim_results: { is_win: true } },
      { id: "2", scrim_results: { is_win: false } },
    ];
    mockFrom.then = vi.fn((resolve) => resolve({ data: dbData, error: null }));

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 1, losses: 1, draws: 0, total: 2 });
  });

  it("correctly triggers query with expected filters", async () => {
    mockFrom.then = vi.fn((resolve) => resolve({ data: [], error: null }));

    await getScrimWinLossRecord("org-xyz");

    expect(mockSupabase.from).toHaveBeenCalledWith("scrims");
    expect(mockFrom.select).toHaveBeenCalledWith("id, scrim_results(is_win)");
    expect(mockFrom.eq).toHaveBeenNthCalledWith(1, "organization_id", "org-xyz");
    expect(mockFrom.eq).toHaveBeenNthCalledWith(2, "status", "completed");
  });
});

describe("listScrims", () => {
  let mockQuery: any;
  let mockSupabase: any;

  const makeScrimRow = (id: string, status: string) => ({
    id,
    status,
    opponent_name: `Opponent ${id}`,
    scheduled_at: "2026-05-15T10:00:00Z",
    format: "bo3",
    organization_id: "org-1",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns empty array on database error", async () => {
    mockQuery.order = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: null, error: { message: "DB error" } }),
    }));

    const result = await listScrims("org-1", "upcoming");
    expect(result).toEqual([]);
  });

  it("returns empty array when no scrims found", async () => {
    mockQuery.order = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: [], error: null }),
    }));

    const result = await listScrims("org-1", "upcoming");
    expect(result).toEqual([]);
  });

  it("filters upcoming scrims with gte and ascending order", async () => {
    const scrims = [makeScrimRow("s1", "scheduled")];
    mockQuery.order = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: scrims, error: null }),
    }));

    const result = await listScrims("org-1", "upcoming");
    expect(result).toHaveLength(1);
    expect(result[0]!.result).toBeNull();
    expect(mockQuery.gte).toHaveBeenCalledWith("scheduled_at", expect.any(String));
  });

  it("filters ongoing scrims using or clause", async () => {
    const scrims = [makeScrimRow("s1", "ongoing")];
    mockQuery.order = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: scrims, error: null }),
    }));

    const result = await listScrims("org-1", "ongoing");
    expect(result).toHaveLength(1);
    expect(mockQuery.or).toHaveBeenCalled();
  });

  it("filters all scrims with limit", async () => {
    const scrims = [makeScrimRow("s1", "completed"), makeScrimRow("s2", "scheduled")];
    mockQuery.limit = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: scrims, error: null }),
    }));

    const result = await listScrims("org-1", "all");
    expect(result).toHaveLength(2);
  });

  it("maps completed scrims with results from scrim_results table", async () => {
    const scrims = [makeScrimRow("s1", "completed")];
    const scrimResults = [
      { scrim_id: "s1", our_score: 2, opponent_score: 1, is_win: true },
    ];

    let fromCallIndex = 0;
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      fromCallIndex++;
      if (table === "scrims") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnValue({
            then: (resolve: any) => resolve({ data: scrims, error: null }),
          }),
        };
      }
      if (table === "scrim_results") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnValue({
            then: (resolve: any) => resolve({ data: scrimResults, error: null }),
          }),
        };
      }
      return mockQuery;
    });

    const result = await listScrims("org-1", "completed");
    expect(result[0]!.result?.is_win).toBe(true);
    expect(result[0]!.result?.our_score).toBe(2);
  });

  it("handles completed scrims with no results (null result)", async () => {
    const scrims = [makeScrimRow("s1", "completed")];

    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "scrims") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnValue({
            then: (resolve: any) => resolve({ data: scrims, error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnValue({
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
      };
    });

    const result = await listScrims("org-1", "completed");
    expect(result[0]!.result).toBeNull();
  });
});
