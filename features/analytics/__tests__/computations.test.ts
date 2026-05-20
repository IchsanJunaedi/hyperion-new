import { describe, it, expect } from "vitest";
import {
  computeOverviewStats,
  computeFormatBreakdown,
  computePlayerStats,
  type RawScrimResult,
  type RawAttendance,
  type PlayerInfo,
} from "@/features/analytics/computations";

// ── helpers ────────────────────────────────────────────────────────────────
const makeResult = (
  scrim_id: string,
  format: string,
  is_win: boolean | null,
): RawScrimResult => ({ scrim_id, format, is_win });

const makeAtt = (
  user_id: string,
  scrim_id: string,
  status: RawAttendance["status"],
): RawAttendance => ({ user_id, scrim_id, status });

const makePlayer = (user_id: string): PlayerInfo => ({
  user_id,
  display_name: `Player ${user_id}`,
  avatar_url: null,
  jersey_number: null,
  position: null,
});

// ── computeOverviewStats ───────────────────────────────────────────────────
describe("computeOverviewStats", () => {
  it("returns zeros for empty input", () => {
    expect(computeOverviewStats([])).toEqual({
      total: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
    });
  });

  it("calculates win rate correctly for all wins", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", true),
    ];
    const stats = computeOverviewStats(results);
    expect(stats.wins).toBe(2);
    expect(stats.losses).toBe(0);
    expect(stats.winRate).toBe(100);
  });

  it("handles draws (is_win = null)", () => {
    const results = [
      makeResult("s1", "bo2", null),
      makeResult("s2", "bo2", true),
    ];
    const stats = computeOverviewStats(results);
    expect(stats.draws).toBe(1);
    expect(stats.total).toBe(2);
    expect(stats.winRate).toBe(50);
  });

  it("rounds win rate to nearest integer", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
      makeResult("s3", "bo3", false),
    ];
    const stats = computeOverviewStats(results);
    expect(stats.winRate).toBe(33);
  });
});

// ── computeFormatBreakdown ─────────────────────────────────────────────────
describe("computeFormatBreakdown", () => {
  it("returns empty array for empty input", () => {
    expect(computeFormatBreakdown([])).toEqual([]);
  });

  it("groups results by format", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
      makeResult("s3", "bo1", true),
    ];
    const breakdown = computeFormatBreakdown(results);
    const bo3 = breakdown.find((f) => f.format === "bo3");
    const bo1 = breakdown.find((f) => f.format === "bo1");
    expect(bo3?.total).toBe(2);
    expect(bo1?.total).toBe(1);
  });

  it("sorts by total descending", () => {
    const results = [
      makeResult("s1", "bo1", true),
      makeResult("s2", "bo3", true),
      makeResult("s3", "bo3", false),
      makeResult("s4", "bo3", true),
    ];
    const breakdown = computeFormatBreakdown(results);
    expect(breakdown[0]!.format).toBe("bo3");
    expect(breakdown[1]!.format).toBe("bo1");
  });
});

// ── computePlayerStats ─────────────────────────────────────────────────────
describe("computePlayerStats", () => {
  it("returns empty array when no players", () => {
    const results = [makeResult("s1", "bo3", true)];
    expect(computePlayerStats([], [], results)).toEqual([]);
  });

  it("calculates attendance rate correctly", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
    ];
    const attendances = [makeAtt("p1", "s1", "confirmed")];
    const players = [makePlayer("p1")];
    const stats = computePlayerStats(players, attendances, results);
    expect(stats[0]!.attendanceRate).toBe(50);
    expect(stats[0]!.totalPresent).toBe(1);
    expect(stats[0]!.totalScrims).toBe(2);
  });

  it("calculates win rate when present correctly", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
      makeResult("s3", "bo3", true),
    ];
    const attendances = [
      makeAtt("p1", "s1", "confirmed"),
      makeAtt("p1", "s2", "confirmed"),
      makeAtt("p1", "s3", "declined"),
    ];
    const players = [makePlayer("p1")];
    const stats = computePlayerStats(players, attendances, results);
    expect(stats[0]!.scrimsWhenPresent).toBe(2);
    expect(stats[0]!.winsWhenPresent).toBe(1);
    expect(stats[0]!.winRateWhenPresent).toBe(50);
  });

  it("calculates positive streak (hadir beruntun)", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
      makeResult("s3", "bo3", true),
    ];
    const attendances = [
      makeAtt("p1", "s1", "confirmed"),
      makeAtt("p1", "s2", "confirmed"),
      makeAtt("p1", "s3", "declined"),
    ];
    const players = [makePlayer("p1")];
    const stats = computePlayerStats(players, attendances, results);
    expect(stats[0]!.streak).toBe(2);
  });

  it("calculates negative streak (absen beruntun)", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", false),
    ];
    const attendances = [
      makeAtt("p1", "s1", "declined"),
      makeAtt("p1", "s2", "confirmed"),
    ];
    const players = [makePlayer("p1")];
    const stats = computePlayerStats(players, attendances, results);
    expect(stats[0]!.streak).toBe(-1);
  });

  it("sorts players by attendanceRate descending", () => {
    const results = [
      makeResult("s1", "bo3", true),
      makeResult("s2", "bo3", true),
    ];
    const attendances = [
      makeAtt("p1", "s1", "confirmed"),
      makeAtt("p2", "s1", "confirmed"),
      makeAtt("p2", "s2", "confirmed"),
    ];
    const players = [makePlayer("p1"), makePlayer("p2")];
    const stats = computePlayerStats(players, attendances, results);
    expect(stats[0]!.user_id).toBe("p2");
    expect(stats[1]!.user_id).toBe("p1");
  });
});
