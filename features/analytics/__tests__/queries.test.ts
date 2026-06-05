/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getHeroStatistics, getHeroDetail, getOverviewStats, getRecentScrims, getDraftAnalytics, getEnterprisePlayerStats, getOpponentSummary, getPlayerTrendByMonth } from "../queries";
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
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQuery),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns empty draft analytics when no completed scrims", async () => {
    mockQuery.limit = vi.fn().mockResolvedValue({ data: [], error: null });

    const result = await getDraftAnalytics("org-1");
    expect(result).toEqual({ byRole: {}, topOverall: [] });
  });

  it("returns empty draft analytics when scrim data is null", async () => {
    mockQuery.limit = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await getDraftAnalytics("org-1");
    expect(result).toEqual({ byRole: {}, topOverall: [] });
  });

  it("returns empty when no picks exist for scrims", async () => {
    const scrims = [{ id: "s1" }];

    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "scrims") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: scrims, error: null }),
        };
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
      limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
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

describe("getDraftAnalytics — with picks data", () => {
  let mockSupabase: any;

  const makeThenable = (data: any) => {
    const q: any = {};
    for (const m of ["select", "eq", "in", "not", "order", "limit"]) {
      q[m] = vi.fn().mockReturnValue(q);
    }
    q.then = (resolve: any) => resolve({ data, error: null });
    return q;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds byRole and topOverall from picks and game results", async () => {
    const scrims = [{ id: "s1" }];
    const picks = [
      { scrim_id: "s1", game_number: 1, role: "Gold", hero_name: "Layla" },
      { scrim_id: "s1", game_number: 1, role: "Gold", hero_name: "Layla" },
      { scrim_id: "s1", game_number: 2, role: "Exp", hero_name: "Chou" },
    ];
    const gameResults = [
      { scrim_id: "s1", game_number: 1, is_win: true },
      { scrim_id: "s1", game_number: 2, is_win: false },
    ];

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeThenable(scrims);
        if (table === "scrim_draft_picks") return makeThenable(picks);
        if (table === "scrim_game_results") return makeThenable(gameResults);
        return makeThenable([]);
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getDraftAnalytics("org-1");

    expect(result.byRole["Gold"]).toBeDefined();
    expect(result.byRole["Gold"]![0]!.hero_name).toBe("Layla");
    expect(result.byRole["Gold"]![0]!.picks).toBe(2);
    expect(result.byRole["Gold"]![0]!.winRate).toBe(100);

    expect(result.byRole["Exp"]).toBeDefined();
    expect(result.byRole["Exp"]![0]!.hero_name).toBe("Chou");

    expect(result.topOverall.length).toBeGreaterThan(0);
    expect(result.topOverall[0]!.hero_name).toBe("Layla");
  });

  it("counts wins only when game_number and scrim_id match in gameWinMap", async () => {
    const scrims = [{ id: "s1" }];
    const picks = [
      { scrim_id: "s1", game_number: 1, role: "Roam", hero_name: "Tigreal" },
    ];
    const gameResults = [
      { scrim_id: "s1", game_number: 99, is_win: true },
    ];

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeThenable(scrims);
        if (table === "scrim_draft_picks") return makeThenable(picks);
        if (table === "scrim_game_results") return makeThenable(gameResults);
        return makeThenable([]);
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getDraftAnalytics("org-1");
    expect(result.topOverall[0]!.wins).toBe(0);
    expect(result.topOverall[0]!.winRate).toBe(0);
  });

  it("returns empty when picks are empty array after scrim query", async () => {
    const scrims = [{ id: "s1" }];

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeThenable(scrims);
        return makeThenable([]);
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getDraftAnalytics("org-1");
    expect(result).toEqual({ byRole: {}, topOverall: [] });
  });
});

describe("getEnterprisePlayerStats", () => {
  let mockSupabase: any;

  const makeThenable = (data: any) => {
    const q: any = {};
    for (const m of ["select", "eq", "in", "order", "not", "limit"]) {
      q[m] = vi.fn().mockReturnValue(q);
    }
    q.then = (resolve: any) => resolve({ data, error: null });
    return q;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no completed scrims", async () => {
    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeThenable([]);
        return makeThenable([]);
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getEnterprisePlayerStats("org-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when scrims data is null", async () => {
    mockSupabase = {
      from: vi.fn().mockImplementation(() => makeThenable(null)),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getEnterprisePlayerStats("org-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when no active members", async () => {
    const scrims = [{ id: "s1", format: "bo3", scrim_results: [{ is_win: true }] }];

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeThenable(scrims);
        if (table === "team_members") return makeThenable([]);
        return makeThenable([]);
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getEnterprisePlayerStats("org-1");
    expect(result).toEqual([]);
  });

  it("returns player stats array when members and scrims exist", async () => {
    const scrims = [{ id: "s1", format: "bo3", scrim_results: [{ is_win: true }] }];
    const members = [
      { user_id: "u1", jersey_number: 7, position: "Gold", main_role: "Gold" },
    ];
    const profiles = [{ id: "u1", display_name: "Player One", avatar_url: null }];

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeThenable(scrims);
        if (table === "team_members") return makeThenable(members);
        if (table === "profiles") return makeThenable(profiles);
        return makeThenable([]);
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getEnterprisePlayerStats("org-1");
    expect(result).toHaveLength(1);
    expect(result[0]!.user_id).toBe("u1");
    expect(result[0]!.display_name).toBe("Player One");
    expect(result[0]!.heroPool).toEqual([]);
  });

  it("computes avgRating from attendance ratings", async () => {
    const scrims = [
      { id: "s1", format: "bo3", scrim_results: [{ is_win: true }] },
      { id: "s2", format: "bo3", scrim_results: [{ is_win: false }] },
    ];
    const members = [{ user_id: "u1", jersey_number: 1, position: "Mid", main_role: "Mid" }];
    const profiles = [{ id: "u1", display_name: "Player A", avatar_url: null }];
    const attendances = [
      { user_id: "u1", scrim_id: "s1", status: "confirmed", rating: 8 },
      { user_id: "u1", scrim_id: "s2", status: "confirmed", rating: 6 },
    ];

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeThenable(scrims);
        if (table === "team_members") return makeThenable(members);
        if (table === "profiles") return makeThenable(profiles);
        if (table === "scrim_attendances") return makeThenable(attendances);
        return makeThenable([]);
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getEnterprisePlayerStats("org-1");
    expect(result[0]!.avgRating).toBe(7);
  });

  it("builds hero pool from draft picks with win rates", async () => {
    const scrims = [{ id: "s1", format: "bo3", scrim_results: [{ is_win: true }] }];
    const members = [{ user_id: "u1", jersey_number: 1, position: "Gold", main_role: "Gold" }];
    const profiles = [{ id: "u1", display_name: "Player A", avatar_url: null }];
    const picks = [
      { player_id: "u1", hero_name: "Layla", role: "Gold", scrim_id: "s1", game_number: 1 },
      { player_id: "u1", hero_name: "Layla", role: "Gold", scrim_id: "s1", game_number: 2 },
    ];
    const gameResults = [
      { scrim_id: "s1", game_number: 1, is_win: true },
      { scrim_id: "s1", game_number: 2, is_win: false },
    ];

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeThenable(scrims);
        if (table === "team_members") return makeThenable(members);
        if (table === "profiles") return makeThenable(profiles);
        if (table === "scrim_draft_picks") return makeThenable(picks);
        if (table === "scrim_game_results") return makeThenable(gameResults);
        return makeThenable([]);
      }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getEnterprisePlayerStats("org-1");
    expect(result[0]!.heroPool).toHaveLength(1);
    expect(result[0]!.heroPool[0]!.hero_name).toBe("Layla");
    expect(result[0]!.heroPool[0]!.picks).toBe(2);
    expect(result[0]!.heroPool[0]!.winRate).toBe(50);
  });
});

describe("getOpponentSummary", () => {
  const makeThenable = (data: any, error: any = null) => {
    const q: any = {};
    for (const m of ["select", "eq", "limit"]) q[m] = vi.fn().mockReturnValue(q);
    q.then = (resolve: any) => resolve({ data, error });
    return q;
  };

  beforeEach(() => vi.clearAllMocks());

  it("returns empty array on query error", async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(makeThenable(null, { message: "boom" })),
    } as any);

    const result = await getOpponentSummary("org-1");
    expect(result).toEqual([]);
  });

  it("aggregates wins/losses/draws per opponent and sorts by total", async () => {
    const scrims = [
      { opponent_name: "Alpha", scrim_results: [{ is_win: true }] },
      { opponent_name: "Alpha", scrim_results: [{ is_win: false }] },
      { opponent_name: "Alpha", scrim_results: [{ is_win: null }] },
      { opponent_name: "Beta", scrim_results: [{ is_win: true }] },
      { opponent_name: "  ", scrim_results: [{ is_win: true }] }, // skipped (blank)
    ];
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(makeThenable(scrims)),
    } as any);

    const result = await getOpponentSummary("org-1");
    expect(result).toHaveLength(2);
    // Alpha has most matches → first
    expect(result[0]!.opponent_name).toBe("Alpha");
    expect(result[0]!.total).toBe(3);
    expect(result[0]!.wins).toBe(1);
    expect(result[0]!.losses).toBe(1);
    expect(result[0]!.draws).toBe(1);
    expect(result[0]!.winRate).toBe(50); // 1 of 2 decided
    expect(result[1]!.opponent_name).toBe("Beta");
    expect(result[1]!.winRate).toBe(100);
  });

  it("handles null data without throwing", async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(makeThenable(null)),
    } as any);
    const result = await getOpponentSummary("org-1");
    expect(result).toEqual([]);
  });
});

describe("getPlayerTrendByMonth", () => {
  const makeThenable = (data: any, error: any = null) => {
    const q: any = {};
    for (const m of ["select", "eq", "in", "gte", "limit"]) q[m] = vi.fn().mockReturnValue(q);
    q.then = (resolve: any) => resolve({ data, error });
    return q;
  };

  beforeEach(() => vi.clearAllMocks());

  it("returns six empty buckets when there are no scrims", async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue(makeThenable([])),
    } as any);

    const result = await getPlayerTrendByMonth("org-1", "user-1");
    expect(result).toHaveLength(6);
    expect(result.every((b) => b.scrims === 0 && b.attendanceRate === 0 && b.winRate === 0)).toBe(true);
  });

  it("computes attendance and win rate for the player's confirmed scrims", async () => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const iso = now.toISOString();

    const scrims = [
      { id: "s1", scheduled_at: iso, scrim_results: [{ is_win: true }] },
      { id: "s2", scheduled_at: iso, scrim_results: [{ is_win: false }] },
      { id: "s3", scheduled_at: iso, scrim_results: [{ is_win: true }] },
    ];
    const attendances = [
      { scrim_id: "s1", status: "confirmed" },
      { scrim_id: "s2", status: "confirmed" },
      { scrim_id: "s3", status: "declined" },
    ];

    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") return makeThenable(scrims);
        if (table === "scrim_attendances") return makeThenable(attendances);
        return makeThenable([]);
      }),
    } as any);

    const result = await getPlayerTrendByMonth("org-1", "user-1");
    const bucket = result.find((b) => b.month === key)!;
    expect(bucket.scrims).toBe(3);
    // present = 2 of 3 → 67%
    expect(bucket.attendanceRate).toBe(67);
    // decided present games: s1 win, s2 loss → 1/2 = 50%
    expect(bucket.winRate).toBe(50);
  });
});
