/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getHeroStatistics, getHeroDetail, getOverviewStats } from "../queries";
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
