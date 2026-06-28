/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActivePublicTrials } from "../queries";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server");

const mockLimit = vi.fn();
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue({
    from: vi.fn().mockReturnValue({ select: mockSelect }),
  } as any);
});

describe("getActivePublicTrials", () => {
  it("returns empty array on DB error", async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: "db error" } });
    const result = await getActivePublicTrials();
    expect(result).toEqual([]);
  });

  it("queries only active trials", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });
    await getActivePublicTrials();
    expect(mockEq).toHaveBeenCalledWith("status", "active");
  });

  it("returns mapped trials with org data", async () => {
    const raw = [
      {
        id: "t1",
        org_id: "o1",
        title: "Trial MLBB",
        game: "Mobile Legends",
        positions: ["Tank", "Marksman"],
        status: "active",
        public_token: "abc123",
        division_id: null,
        created_by: null,
        created_at: "2026-06-01",
        updated_at: "2026-06-01",
        organizations: { name: "Hyperion Red", slug: "hyperion-red", logo_url: null },
      },
    ];
    mockLimit.mockResolvedValue({ data: raw, error: null });
    const result = await getActivePublicTrials();
    expect(result).toHaveLength(1);
    expect(result[0]?.org_name).toBe("Hyperion Red");
    expect(result[0]?.org_slug).toBe("hyperion-red");
    expect(result[0]?.public_token).toBe("abc123");
  });
});
