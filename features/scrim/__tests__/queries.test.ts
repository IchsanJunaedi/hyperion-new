/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { summarizeAttendance, getScrimWinLossRecord, listScrims, getScrimDetail, getScrimReviewRequest } from "../queries";
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
    main_role: null,
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
  let mockSupabase: any;
  let mockSingle: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle = {
      maybeSingle: vi.fn(),
    };
    mockSupabase = {
      rpc: vi.fn().mockReturnValue(mockSingle),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns all zeros when no scrims are found", async () => {
    mockSingle.maybeSingle.mockResolvedValue({ data: null, error: null });

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 0, losses: 0, draws: 0, total: 0 });
  });

  it("returns all zeros when database error occurs", async () => {
    mockSingle.maybeSingle.mockResolvedValue({ data: null, error: { message: "Error" } });

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 0, losses: 0, draws: 0, total: 0 });
  });

  it("counts wins correctly when all are wins", async () => {
    mockSingle.maybeSingle.mockResolvedValue({
      data: { wins: 2, losses: 0, draws: 0, total: 2 },
      error: null,
    });

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 2, losses: 0, draws: 0, total: 2 });
  });

  it("counts losses correctly when all are losses", async () => {
    mockSingle.maybeSingle.mockResolvedValue({
      data: { wins: 0, losses: 1, draws: 0, total: 1 },
      error: null,
    });

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 0, losses: 1, draws: 0, total: 1 });
  });

  it("counts draws correctly when all are draws", async () => {
    mockSingle.maybeSingle.mockResolvedValue({
      data: { wins: 0, losses: 0, draws: 2, total: 2 },
      error: null,
    });

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 0, losses: 0, draws: 2, total: 2 });
  });

  it("counts mixed wins, losses, and draws correctly", async () => {
    mockSingle.maybeSingle.mockResolvedValue({
      data: { wins: 1, losses: 1, draws: 2, total: 4 },
      error: null,
    });

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 1, losses: 1, draws: 2, total: 4 });
  });

  it("handles scrim_results as a single object (non-array fallback)", async () => {
    mockSingle.maybeSingle.mockResolvedValue({
      data: { wins: 1, losses: 1, draws: 0, total: 2 },
      error: null,
    });

    const record = await getScrimWinLossRecord("org-123");
    expect(record).toEqual({ wins: 1, losses: 1, draws: 0, total: 2 });
  });

  it("correctly triggers query with expected filters", async () => {
    mockSingle.maybeSingle.mockResolvedValue({ data: null, error: null });

    await getScrimWinLossRecord("org-xyz");

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_scrim_win_loss", {
      p_org_id: "org-xyz",
    });
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

describe("getScrimDetail", () => {
  let mockSupabase: any;

  const makeChainable = (data: any) => {
    const q: any = {};
    for (const m of ["select", "eq", "in", "order"]) {
      q[m] = vi.fn().mockReturnValue(q);
    }
    q.maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
    q.then = (resolve: any) => resolve({ data, error: null });
    return q;
  };

  const mockScrim = {
    id: "scrim-1",
    organization_id: "org-1",
    division_id: "div-1",
    status: "completed",
    result_image_path: null,
    opponent_name: "Team B",
    scheduled_at: "2026-05-20T10:00:00Z",
    format: "bo3",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeChainable(mockScrim);
        if (table === "scrim_attendances") return makeChainable([]);
        if (table === "scrim_results") return makeChainable(null);
        if (table === "divisions") return makeChainable({ name: "Main" });
        if (table === "team_members") return makeChainable([]);
        if (table === "profiles") return makeChainable([]);
        return makeChainable(null);
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({ data: null }),
        }),
      },
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns null when scrim not found", async () => {
    mockSupabase.from = vi.fn().mockReturnValue(makeChainable(null));
    const result = await getScrimDetail("not-found");
    expect(result).toBeNull();
  });

  it("returns null on database error", async () => {
    const q = makeChainable(null);
    q.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
    mockSupabase.from = vi.fn().mockReturnValue(q);
    const result = await getScrimDetail("scrim-1");
    expect(result).toBeNull();
  });

  it("returns scrim detail with no attendances", async () => {
    const result = await getScrimDetail("scrim-1");
    expect(result).not.toBeNull();
    expect(result!.scrim.id).toBe("scrim-1");
    expect(result!.attendances).toEqual([]);
    expect(result!.result).toBeNull();
    expect(result!.divisionName).toBe("Main");
    expect(result!.myAttendance).toBeNull();
  });

  it("returns scrim detail with members and builds attendance rows", async () => {
    const members = [
      { user_id: "u1", jersey_number: 7, position: "Gold", role: "captain" },
    ];
    const profiles = [
      { id: "u1", display_name: "Player One", avatar_url: null },
    ];

    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "scrims") return makeChainable(mockScrim);
      if (table === "scrim_attendances") return makeChainable([]);
      if (table === "scrim_results") return makeChainable(null);
      if (table === "divisions") return makeChainable({ name: "Main" });
      if (table === "team_members") return makeChainable(members);
      if (table === "profiles") return makeChainable(profiles);
      return makeChainable(null);
    });

    const result = await getScrimDetail("scrim-1");
    expect(result!.attendances).toHaveLength(1);
    expect(result!.attendances[0]!.member.user_id).toBe("u1");
    expect(result!.attendances[0]!.member.display_name).toBe("Player One");
    expect(result!.attendances[0]!.attendance.status).toBe("pending");
  });

  it("sets myAttendance for the current authenticated user", async () => {
    const attendance = {
      id: "att-1",
      scrim_id: "scrim-1",
      user_id: "user-1",
      status: "confirmed",
      rating: null,
      coach_notes: null,
      responded_at: null,
      created_at: "2026-05-20T09:00:00Z",
    };
    const members = [
      { user_id: "user-1", jersey_number: 1, position: "Exp", role: "captain" },
    ];
    const profiles = [{ id: "user-1", display_name: "Me", avatar_url: null }];

    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "scrims") return makeChainable(mockScrim);
      if (table === "scrim_attendances") return makeChainable([attendance]);
      if (table === "scrim_results") return makeChainable(null);
      if (table === "divisions") return makeChainable(null);
      if (table === "team_members") return makeChainable(members);
      if (table === "profiles") return makeChainable(profiles);
      return makeChainable(null);
    });

    const result = await getScrimDetail("scrim-1");
    expect(result!.myAttendance).not.toBeNull();
    expect(result!.myAttendance!.status).toBe("confirmed");
  });

  it("includes former members who have attendance but are no longer active", async () => {
    const attendance = {
      id: "att-2",
      scrim_id: "scrim-1",
      user_id: "former-user",
      status: "confirmed",
      rating: null,
      coach_notes: null,
      responded_at: null,
      created_at: "2026-05-20T09:00:00Z",
    };
    const profiles = [{ id: "former-user", display_name: "Former Player", avatar_url: null }];

    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "scrims") return makeChainable(mockScrim);
      if (table === "scrim_attendances") return makeChainable([attendance]);
      if (table === "scrim_results") return makeChainable(null);
      if (table === "divisions") return makeChainable(null);
      if (table === "team_members") return makeChainable([]);
      if (table === "profiles") return makeChainable(profiles);
      return makeChainable(null);
    });

    const result = await getScrimDetail("scrim-1");
    expect(result!.attendances).toHaveLength(1);
    expect(result!.attendances[0]!.member.user_id).toBe("former-user");
  });

  it("creates signed URL when result has result_image_path", async () => {
    const scrimWithImage = { ...mockScrim, result_image_path: "path/to/image.png" };
    const scrimResult = {
      id: "r1",
      scrim_id: "scrim-1",
      is_win: true,
      our_score: 2,
      opponent_score: 1,
      result_image_path: "path/to/image.png",
    };
    const signedUrl = "https://supabase.storage/signed-url";

    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "scrims") return makeChainable(scrimWithImage);
      if (table === "scrim_results") return makeChainable(scrimResult);
      if (table === "scrim_attendances") return makeChainable([]);
      if (table === "divisions") return makeChainable(null);
      if (table === "team_members") return makeChainable([]);
      if (table === "profiles") return makeChainable([]);
      return makeChainable(null);
    });
    mockSupabase.storage.from = vi.fn().mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl } }),
    });

    const result = await getScrimDetail("scrim-1");
    expect(result!.resultImageUrl).toBe(signedUrl);
  });

  it("returns null resultImageUrl when no result_image_path", async () => {
    const result = await getScrimDetail("scrim-1");
    expect(result!.resultImageUrl).toBeNull();
  });

  it("handles unauthenticated user (no user from auth.getUser)", async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

    const result = await getScrimDetail("scrim-1");
    expect(result).not.toBeNull();
    expect(result!.myAttendance).toBeNull();
  });
});

describe("getScrimReviewRequest", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns null when no review request exists", async () => {
    const result = await getScrimReviewRequest("scrim-1");
    expect(result).toBeNull();
  });

  it("returns review request data when it exists", async () => {
    const reviewRequest = {
      id: "rr-1",
      scrim_id: "scrim-1",
      requested_by: "user-1",
      notes: "Please review this",
      status: "pending",
      review_notes: null,
      reviewed_at: null,
      reviewed_by: null,
      created_at: "2026-05-20T10:00:00Z",
    };
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: reviewRequest, error: null }),
    };
    mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

    const result = await getScrimReviewRequest("scrim-1");
    expect(result).toEqual(reviewRequest);
  });

  it("queries the correct table with the correct scrim ID", async () => {
    await getScrimReviewRequest("scrim-xyz");
    expect(mockSupabase.from).toHaveBeenCalledWith("scrim_review_requests");
  });
});
