/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getHeroStatistics, getHeroDetail, getOverviewStats, getRecentScrims, getDraftAnalytics } from "../queries";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server");

describe("getHeroStatistics", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      rpc: vi.fn(),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns hero stats array from rpc", async () => {
    const mockRows = [
      {
        hero_name: "Layla",
        pick_total: 10,
        pick_wins: 7,
        pick_losses: 3,
        pick_wr: 70,
        pick_pct: 50,
        team_ban_total: 2,
        team_ban_pct: 10,
        enemy_ban_total: 1,
        enemy_ban_pct: 5,
        pb_total: 13,
        pb_pct: 65,
      },
    ];
    mockSupabase.rpc.mockResolvedValue({ data: mockRows, error: null });

    const result = await getHeroStatistics("org-1");

    expect(result).toEqual(mockRows);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_hero_statistics", { p_org_id: "org-1" });
  });

  it("returns empty array when rpc returns null data", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await getHeroStatistics("org-1");
    expect(result).toEqual([]);
  });

  it("throws when rpc returns an error", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: "RPC failed" } });

    await expect(getHeroStatistics("org-1")).rejects.toThrow("RPC failed");
  });

  it("returns multiple rows correctly", async () => {
    const mockRows = [
      {
        hero_name: "Layla",
        pick_total: 10,
        pick_wins: 7,
        pick_losses: 3,
        pick_wr: 70,
        pick_pct: 50,
        team_ban_total: 2,
        team_ban_pct: 10,
        enemy_ban_total: 1,
        enemy_ban_pct: 5,
        pb_total: 13,
        pb_pct: 65,
      },
      {
        hero_name: "Saber",
        pick_total: 5,
        pick_wins: 2,
        pick_losses: 3,
        pick_wr: 40,
        pick_pct: 25,
        team_ban_total: 0,
        team_ban_pct: 0,
        enemy_ban_total: 3,
        enemy_ban_pct: 15,
        pb_total: 8,
        pb_pct: 40,
      },
    ];
    mockSupabase.rpc.mockResolvedValue({ data: mockRows, error: null });

    const result = await getHeroStatistics("org-2");
    expect(result).toHaveLength(2);
    expect(result[0]!.hero_name).toBe("Layla");
    expect(result[1]!.hero_name).toBe("Saber");
  });
});

describe("getHeroDetail", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      rpc: vi.fn(),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns structured hero detail from rpc", async () => {
    const mockData = {
      played_by_player: [
        { display_name: "Player A", total: 5, wins: 3, losses: 2, win_rate: 60 },
      ],
      played_with: [
        { hero_name: "Tigreal", total: 4, wins: 3, losses: 1, win_rate: 75 },
      ],
      played_against: [
        { hero_name: "Franco", total: 2, wins: 1, losses: 1, win_rate: 50 },
      ],
    };
    mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

    const result = await getHeroDetail("org-1", "Layla");

    expect(result).toEqual(mockData);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_hero_detail", {
      p_org_id: "org-1",
      p_hero_name: "Layla",
    });
  });

  it("returns empty arrays when rpc returns null data", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await getHeroDetail("org-1", "Layla");
    expect(result).toEqual({
      played_by_player: [],
      played_with: [],
      played_against: [],
    });
  });

  it("throws when rpc returns an error", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: "Hero not found" } });

    await expect(getHeroDetail("org-1", "Layla")).rejects.toThrow("Hero not found");
  });

  it("returns empty sub-arrays when data fields are missing", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: {}, error: null });

    const result = await getHeroDetail("org-1", "Layla");
    expect(result.played_by_player).toEqual([]);
    expect(result.played_with).toEqual([]);
    expect(result.played_against).toEqual([]);
  });

  it("passes correct hero name to rpc", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

    await getHeroDetail("org-5", "Karina");

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_hero_detail", {
      p_org_id: "org-5",
      p_hero_name: "Karina",
    });
  });
});

describe("getRecentScrims", () => {
  let mockQuery: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns empty array when no scrims found", async () => {
    mockQuery.limit = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: [], error: null }),
    }));

    const result = await getRecentScrims("org-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    mockQuery.limit = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: null, error: null }),
    }));

    const result = await getRecentScrims("org-1");
    expect(result).toEqual([]);
  });

  it("maps scrim data with array scrim_results", async () => {
    const scrims = [
      {
        id: "s1",
        opponent_name: "Team B",
        scheduled_at: "2026-05-01T10:00:00Z",
        format: "bo3",
        division_id: null,
        scrim_results: [{ is_win: true, our_score: 2, opponent_score: 0 }],
      },
    ];
    mockQuery.limit = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: scrims, error: null }),
    }));

    const result = await getRecentScrims("org-1");
    expect(result).toHaveLength(1);
    expect(result[0]!.is_win).toBe(true);
    expect(result[0]!.our_score).toBe(2);
    expect(result[0]!.division_name).toBeNull();
  });

  it("maps non-array scrim_results correctly", async () => {
    const scrims = [
      {
        id: "s1",
        opponent_name: "Team B",
        scheduled_at: "2026-05-01T10:00:00Z",
        format: "bo1",
        division_id: null,
        scrim_results: { is_win: false, our_score: 0, opponent_score: 1 },
      },
    ];
    mockQuery.limit = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: scrims, error: null }),
    }));

    const result = await getRecentScrims("org-1");
    expect(result[0]!.is_win).toBe(false);
  });

  it("fetches divisions and maps division_name", async () => {
    const scrims = [
      {
        id: "s1",
        opponent_name: "Team B",
        scheduled_at: "2026-05-01T10:00:00Z",
        format: "bo3",
        division_id: "div-1",
        scrim_results: [],
      },
    ];

    let callCount = 0;
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "scrims") {
        return {
          ...mockQuery,
          limit: vi.fn().mockReturnValue({
            then: (resolve: any) => resolve({ data: scrims, error: null }),
          }),
        };
      }
      if (table === "divisions") {
        callCount++;
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnValue({
            then: (resolve: any) =>
              resolve({ data: [{ id: "div-1", name: "Main" }], error: null }),
          }),
        };
      }
      return mockQuery;
    });

    const result = await getRecentScrims("org-1");
    expect(result[0]!.division_name).toBe("Main");
    expect(callCount).toBe(1);
  });
});

describe("getDraftAnalytics", () => {
  let mockQuery: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns empty draft analytics when no completed scrims", async () => {
    mockQuery.eq = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: [], error: null }),
    }));

    const result = await getDraftAnalytics("org-1");
    expect(result).toEqual({ byRole: {}, topOverall: [] });
  });

  it("returns empty draft analytics when scrim data is null", async () => {
    mockQuery.eq = vi.fn().mockImplementation(() => ({
      ...mockQuery,
      then: (resolve: any) => resolve({ data: null, error: null }),
    }));

    const result = await getDraftAnalytics("org-1");
    expect(result).toEqual({ byRole: {}, topOverall: [] });
  });

  it("returns empty when no picks exist for scrims", async () => {
    const scrims = [{ id: "s1" }];

    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "scrims") {
        const q: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
        q.eq = vi.fn().mockImplementation(() => {
          // return a thenable that resolves to data after second .eq()
          const inner: any = {
            eq: vi.fn().mockReturnValue({
              then: (resolve: any) => resolve({ data: scrims, error: null }),
            }),
            then: (resolve: any) => resolve({ data: scrims, error: null }),
          };
          return inner;
        });
        return q;
      }
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      };
    });

    const result = await getDraftAnalytics("org-1");
    expect(result).toEqual({ byRole: {}, topOverall: [] });
  });
});

describe("getOverviewStats", () => {
  let mockQuery: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns zero stats when no completed scrims", async () => {
    mockQuery.eq = vi.fn().mockImplementation(() => {
      // chain: .eq(...).eq(...) returns a thenable
      const self = { ...mockQuery };
      self.then = (resolve: any) => resolve({ data: [], error: null });
      return self;
    });

    const result = await getOverviewStats("org-1");
    expect(result.stats).toBeDefined();
    expect(result.formatBreakdown).toBeDefined();
  });

  it("calculates stats from scrim results with array scrim_results", async () => {
    const data = [
      { id: "s1", format: "bo3", scrim_results: [{ is_win: true }] },
      { id: "s2", format: "bo3", scrim_results: [{ is_win: false }] },
    ];
    mockQuery.eq = vi.fn().mockImplementation(() => {
      const self = { ...mockQuery };
      self.then = (resolve: any) => resolve({ data, error: null });
      return self;
    });

    const result = await getOverviewStats("org-1");
    expect(result.stats.total).toBe(2);
    expect(result.stats.wins).toBe(1);
  });

  it("handles null scrim_results gracefully", async () => {
    const data = [{ id: "s1", format: "bo1", scrim_results: null }];
    mockQuery.eq = vi.fn().mockImplementation(() => {
      const self = { ...mockQuery };
      self.then = (resolve: any) => resolve({ data, error: null });
      return self;
    });

    const result = await getOverviewStats("org-1");
    expect(result.stats.total).toBe(1);
    expect(result.stats.wins).toBe(0);
  });
});
