/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildMonthKeys,
  monthKeyOf,
  monthLabelOf,
  bucketScrims,
  bucketAttendance,
  bucketFinances,
} from "@/features/dashboard/queries/homeCharts";
import { getHomeChartData } from "@/features/dashboard/queries/homeCharts";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin");

describe("buildMonthKeys", () => {
  it("returns 6 keys oldest to newest including current month", () => {
    expect(buildMonthKeys(new Date(2026, 5, 12))).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
    ]);
  });

  it("handles year boundary", () => {
    expect(buildMonthKeys(new Date(2026, 1, 15))).toEqual([
      "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02",
    ]);
  });
});

describe("monthKeyOf / monthLabelOf", () => {
  it("extracts month key from timestamp", () => {
    expect(monthKeyOf("2026-03-15T10:00:00")).toBe("2026-03");
  });

  it("maps key to Indonesian short label", () => {
    expect(monthLabelOf("2026-05")).toBe("Mei");
    expect(monthLabelOf("2026-08")).toBe("Agu");
  });
});

describe("bucketScrims", () => {
  const keys = ["2026-04", "2026-05", "2026-06"];

  it("computes win rate per month from completed scrims only", () => {
    const scrims = [
      { id: "a", scheduled_at: "2026-05-10T12:00:00", status: "completed", scrim_results: { is_win: true } },
      { id: "b", scheduled_at: "2026-05-20T12:00:00", status: "completed", scrim_results: [{ is_win: false }] },
      { id: "c", scheduled_at: "2026-05-25T12:00:00", status: "scheduled", scrim_results: null },
    ];
    const out = bucketScrims(scrims, keys);
    expect(out[1]).toEqual({ monthKey: "2026-05", winRate: 50, scrimCount: 2 });
    expect(out[0]).toEqual({ monthKey: "2026-04", winRate: 0, scrimCount: 0 });
  });

  it("ignores scrims outside the window", () => {
    const scrims = [
      { id: "old", scheduled_at: "2026-01-10T12:00:00", status: "completed", scrim_results: { is_win: true } },
    ];
    const out = bucketScrims(scrims, keys);
    expect(out.every((m) => m.scrimCount === 0)).toBe(true);
  });
});

describe("bucketAttendance", () => {
  const keys = ["2026-05", "2026-06"];

  it("computes confirmed percentage per month via scrim month map", () => {
    const scrimMonth = new Map([["s1", "2026-05"], ["s2", "2026-06"]]);
    const attendances = [
      { scrim_id: "s1", status: "confirmed" },
      { scrim_id: "s1", status: "declined" },
      { scrim_id: "s2", status: "confirmed" },
      { scrim_id: "unknown", status: "confirmed" },
    ];
    expect(bucketAttendance(attendances, scrimMonth, keys)).toEqual([50, 100]);
  });

  it("returns 0 for months with no attendance", () => {
    expect(bucketAttendance([], new Map(), keys)).toEqual([0, 0]);
  });
});

describe("bucketFinances", () => {
  const keys = ["2026-05", "2026-06"];

  it("buckets income/expense per month with cumulative balance", () => {
    const finances = [
      { type: "income" as const, amount: 1000, date: "2026-05-10" },
      { type: "expense" as const, amount: 300, date: "2026-05-15" },
      { type: "expense" as const, amount: 200, date: "2026-06-01" },
    ];
    expect(bucketFinances(finances, keys)).toEqual([
      { income: 1000, expense: 300, cumulativeBalance: 700 },
      { income: 0, expense: 200, cumulativeBalance: 500 },
    ]);
  });

  it("includes pre-window transactions as starting offset", () => {
    const finances = [
      { type: "income" as const, amount: 5000, date: "2026-01-10" },
      { type: "expense" as const, amount: 1000, date: "2026-03-05" },
      { type: "income" as const, amount: 100, date: "2026-06-02" },
    ];
    expect(bucketFinances(finances, keys)).toEqual([
      { income: 0, expense: 0, cumulativeBalance: 4000 },
      { income: 100, expense: 0, cumulativeBalance: 4100 },
    ]);
  });
});

function chain(result: { data: unknown; error: unknown }) {
  const c: any = {
    select: () => c,
    eq: () => c,
    gte: () => c,
    in: () => c,
    limit: () => Promise.resolve(result),
  };
  return c;
}

describe("getHomeChartData", () => {
  beforeEach(() => {
    const tables: Record<string, { data: unknown; error: unknown }> = {
      scrims: { data: [], error: null },
      finances: { data: [], error: null },
      sponsors: {
        data: [
          { name: "Acme", deal_value: 1_000_000 },
          { name: "ZeroCo", deal_value: 0 },
          { name: "NullCo", deal_value: null },
        ],
        error: null,
      },
      scrim_attendances: { data: [], error: null },
    };
    vi.mocked(createAdminClient).mockReturnValue({
      from: (table: string) => chain(tables[table] ?? { data: [], error: null }),
    } as any);
  });

  it("returns exactly 6 months and filters zero-value sponsors", async () => {
    const out = await getHomeChartData("org-1");
    expect(out.months).toHaveLength(6);
    expect(out.months.every((m) => m.scrimCount === 0 && m.winRate === 0)).toBe(true);
    expect(out.sponsors).toEqual([{ name: "Acme", value: 1_000_000 }]);
  });

  it("accepts an array of org ids (Semua mode)", async () => {
    const out = await getHomeChartData(["org-1", "org-2"]);
    expect(out.months).toHaveLength(6);
    expect(out.sponsors).toEqual([{ name: "Acme", value: 1_000_000 }]);
  });
});
