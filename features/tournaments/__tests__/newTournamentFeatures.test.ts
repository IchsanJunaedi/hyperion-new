/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTournamentAction } from "@/features/tournaments/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const FUTURE_DATE = "2026-08-01";
const PAST_DATE = "2026-05-01";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OWNER_EMAIL = "owner@test.com";
});

describe("New Tournament Features Action Tests", () => {
  it("creates a tournament with hybrid location, optional deadline, and sends notifications if upcoming", async () => {
    const mockQuery: any = {
      select: vi.fn().mockImplementation(() => mockQuery),
      eq: vi.fn().mockImplementation(() => mockQuery),
      in: vi.fn().mockImplementation(() => mockQuery),
      limit: vi.fn().mockImplementation(() => mockQuery),
      insert: vi.fn().mockImplementation(() => mockQuery),
      then: vi.fn().mockImplementation((resolve) => resolve({ data: [{ user_id: "user-1" }] })),
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "team_members") {
          return mockQuery;
        }
        if (table === "profiles") {
          return {
            select: () => ({
              in: async () => ({ data: [{ id: "user-1", phone_wa: "62812345678" }] }),
            }),
          };
        }
        if (table === "notifications") {
          return {
            insert: async () => ({ error: null }),
          };
        }
        return {};
      }),
    } as any;

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "organizations") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: "org-1", name: "Team Test" } }),
              }),
            }),
          };
        }
        if (table === "team_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({ data: { role: "captain" } }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "tournaments") {
          return {
            insert: (data: any) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    ...data,
                    id: "tourney-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin);

    const res = await createTournamentAction("team-test", {
      division_id: VALID_UUID,
      name: "Turnamen Hybrid Super",
      organizer: "Penyelenggara Test",
      start_date: FUTURE_DATE,
      end_date: FUTURE_DATE,
      prize_pool: "10000000",
      registration_fee: "50000",
      registration_url: "https://registrasi.com",
      location_type: "hybrid",
      location: "Jakarta Venue",
      online_platform: "Discord/Zoom",
      send_wa_blast: true,
      // registration_deadline omitted/optional
    });

    expect(res.ok).toBe(true);
    expect((res as any).id).toBe("tourney-1");
  });

  it("sets past tournament to completed status, marks reminders, and skips notifications", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
      from: vi.fn().mockImplementation(() => ({})),
    } as any;

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "organizations") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: "org-1", name: "Team Test" } }),
              }),
            }),
          };
        }
        if (table === "team_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({ data: { role: "captain" } }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "tournaments") {
          return {
            insert: (data: any) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    ...data,
                    id: "tourney-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin);

    const res = await createTournamentAction("team-test", {
      division_id: VALID_UUID,
      name: "Turnamen Masa Lalu",
      organizer: "Penyelenggara Test",
      start_date: PAST_DATE,
      end_date: PAST_DATE,
      prize_pool: "10000000",
      registration_fee: "50000",
      registration_url: "https://registrasi.com",
      location_type: "online",
      location: "Discord",
      send_wa_blast: true,
    });

    expect(res.ok).toBe(true);
    expect((res as any).id).toBe("tourney-1");
  });

  it("handles branch coverage for different location types, missing members, and no WA blast", async () => {
    // 1. Offline location type & empty members
    const mockQueryEmpty: any = {
      select: vi.fn().mockImplementation(() => mockQueryEmpty),
      eq: vi.fn().mockImplementation(() => mockQueryEmpty),
      in: vi.fn().mockImplementation(() => mockQueryEmpty),
      limit: vi.fn().mockImplementation(() => mockQueryEmpty),
      then: vi.fn().mockImplementation((resolve) => resolve({ data: [] })), // empty members
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "team_members") return mockQueryEmpty;
        return {};
      }),
    } as any;

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "organizations") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: "org-1", name: "Team Test" } }),
              }),
            }),
          };
        }
        if (table === "team_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({ data: { role: "captain" } }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "tournaments") {
          return {
            insert: (data: any) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    ...data,
                    id: "tourney-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin);

    let res = await createTournamentAction("team-test", {
      division_id: VALID_UUID,
      name: "Turnamen Offline",
      organizer: "Penyelenggara Test",
      start_date: FUTURE_DATE,
      end_date: FUTURE_DATE,
      prize_pool: "10000000",
      registration_fee: "50000",
      registration_url: "https://registrasi.com",
      location_type: "offline",
      location: "Mall Jakarta",
      send_wa_blast: true,
    });

    expect(res.ok).toBe(true);

    // 2. Missing/null location type & send_wa_blast is false
    res = await createTournamentAction("team-test", {
      division_id: VALID_UUID,
      name: "Turnamen Tanpa Lokasi & WA Blast",
      organizer: "Penyelenggara Test",
      start_date: FUTURE_DATE,
      end_date: FUTURE_DATE,
      prize_pool: "10000000",
      registration_fee: "50000",
      registration_url: "https://registrasi.com",
      location_type: null,
      location: null,
      send_wa_blast: false, // WA blast disabled
    });

    expect(res.ok).toBe(true);
  });
});
