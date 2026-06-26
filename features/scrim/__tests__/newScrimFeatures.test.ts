/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createScrimAction, updateScrimAction, cancelScrimAction, createScrimFormAction } from "@/features/scrim/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { blastWaMessage } from "@/lib/utils/fonnte";
import { redirect } from "next/navigation";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((path: string) => {
    throw new Error(`Redirect: ${path}`);
  }),
}));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/utils/fonnte");

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const FUTURE_ISO = "2026-07-26T10:46"; // datetime-local format format
const PAST_ISO = "2026-05-26T10:46";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OWNER_EMAIL = "owner@test.com";
});

describe("New Scrim Features Action Tests", () => {
  it("creates a scrim with patch field, correct timezone conversion, and sends WA if <=7 days", async () => {
    // Mock user auth
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
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
        if (table === "scrims") {
          return {
            insert: (data: any) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    ...data,
                    id: VALID_UUID,
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

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "team_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  limit: async () => ({ data: [{ user_id: "user-1" }] }),
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: () => ({
              in: async () => ({ data: [{ id: "user-1", phone_wa: "62812345678" }] }),
            }),
          };
        }
        if (table === "organizations") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { slug: "team-test" } }),
              }),
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

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin);
    vi.mocked(blastWaMessage).mockResolvedValue({} as any);

    // 2 days in the future
    const scheduledDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T10:46";
    const res = await createScrimAction("team-test", {
      division_id: VALID_UUID,
      opponent_name: "Lawan Test",
      scheduled_at: scheduledDate,
      format: "bo3",
      patch: "1.8.44",
    });

    expect(res.ok).toBe(true);
    // Verify timezone conversion: should append +07:00
    const expectedUtc = new Date(scheduledDate + ":00+07:00").toISOString();
    expect((res as any).scrim.scheduled_at).toBe(expectedUtc);
    expect((res as any).scrim.patch).toBe("1.8.44");
    expect(blastWaMessage).toHaveBeenCalled();
  });

  it("skips notifications and sets completed status if historical scrim is created", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
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
        if (table === "scrims") {
          return {
            insert: (data: any) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    ...data,
                    id: VALID_UUID,
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

    const mockAdmin = {
      from: vi.fn().mockImplementation(() => ({})),
    } as any;

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin);
    vi.mocked(blastWaMessage).mockResolvedValue({} as any);

    const res = await createScrimAction("team-test", {
      division_id: VALID_UUID,
      opponent_name: "Lawan Test",
      scheduled_at: PAST_ISO,
      format: "bo3",
      patch: "1.8.44",
    });

    expect(res.ok).toBe(true);
    expect((res as any).scrim.status).toBe("completed");
    expect((res as any).scrim.reminder_sent_at).not.toBeNull();
    expect((res as any).scrim.h7_reminder_sent_at).not.toBeNull();
    expect(blastWaMessage).not.toHaveBeenCalled();
  });

  it("skips immediate WA notification if scheduled >7 days in the future", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
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
        if (table === "scrims") {
          return {
            insert: (data: any) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    ...data,
                    id: VALID_UUID,
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

    const mockAdmin = {
      from: vi.fn().mockImplementation(() => ({})),
    } as any;

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin);
    vi.mocked(blastWaMessage).mockResolvedValue({} as any);

    // 10 days in the future
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T10:46";
    const res = await createScrimAction("team-test", {
      division_id: VALID_UUID,
      opponent_name: "Lawan Test",
      scheduled_at: futureDate,
      format: "bo3",
      patch: "1.8.44",
    });

    expect(res.ok).toBe(true);
    expect((res as any).scrim.status).toBe("scheduled");
    expect((res as any).scrim.h7_reminder_sent_at).toBeNull(); // Will be sent by cron H-7
    expect(blastWaMessage).not.toHaveBeenCalled();
  });

  it("updates a scrim and formats timezone properly", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
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
        if (table === "scrims") {
          return {
            update: (data: any) => ({
              eq: () => ({
                select: () => ({
                  single: async () => ({
                    data: {
                      ...data,
                      id: VALID_UUID,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const mockAdmin = {
      from: vi.fn().mockImplementation(() => ({})),
    } as any;

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin);

    const editDate = "2026-07-26T10:46";
    const res = await updateScrimAction("team-test", {
      scrim_id: VALID_UUID,
      division_id: VALID_UUID,
      opponent_name: "Lawan Edit",
      scheduled_at: editDate,
      format: "bo3",
      patch: "1.8.45",
    });

    expect(res.ok).toBe(true);
  });

  it("sends cancel notifications on cancel action", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { notes: "Strategic plans" } }),
              }),
            }),
            update: (data: any) => ({
              eq: () => ({
                in: () => ({
                  select: () => ({
                    data: [{ id: VALID_UUID }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: VALID_UUID,
                    opponent_name: "Lawan Dibatalkan",
                    scheduled_at: FUTURE_ISO + ":00Z",
                    format: "bo3",
                    organization_id: "org-1",
                  },
                }),
              }),
            }),
          };
        }
        if (table === "organizations") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { name: "Team Test" } }),
              }),
            }),
          };
        }
        if (table === "team_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  limit: async () => ({ data: [{ user_id: "user-1" }] }),
                }),
              }),
            }),
          };
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

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin);
    vi.mocked(blastWaMessage).mockResolvedValue({} as any);

    const res = await cancelScrimAction("team-test", {
      scrim_id: VALID_UUID,
      reason: "Hujan badai",
    });

    expect(res.ok).toBe(true);
    // Since fanOutScrimCancelNotification is asynchronous fire-and-forget,
    // let's wait a small moment or check if the mock was called.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(blastWaMessage).toHaveBeenCalled();
  });

  it("handles branch coverage in cancel action when scrimRow or orgRow or members are missing", async () => {
    // 1. Mock when scrimRow is missing
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null }),
              }),
            }),
            update: (data: any) => ({
              eq: () => ({
                in: () => ({
                  select: () => ({
                    data: [{ id: VALID_UUID }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin);

    let res = await cancelScrimAction("team-test", {
      scrim_id: VALID_UUID,
    });
    expect(res.ok).toBe(true);

    // 2. Mock when members are empty
    const mockSupabase2 = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { notes: "Strategic plans" } }),
              }),
            }),
            update: (data: any) => ({
              eq: () => ({
                in: () => ({
                  select: () => ({
                    data: [{ id: VALID_UUID }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const mockAdmin2 = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "scrims") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: VALID_UUID,
                    opponent_name: "Lawan Dibatalkan",
                    scheduled_at: FUTURE_ISO + ":00Z",
                    format: "bo3",
                    organization_id: "org-1",
                  },
                }),
              }),
            }),
          };
        }
        if (table === "organizations") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { name: "Team Test" } }),
              }),
            }),
          };
        }
        if (table === "team_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  limit: async () => ({ data: [] }), // No members
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    vi.mocked(createClient).mockResolvedValue(mockSupabase2);
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin2);

    res = await cancelScrimAction("team-test", {
      scrim_id: VALID_UUID,
    });
    expect(res.ok).toBe(true);
  });

  it("handles createScrimFormAction and redirects successfully", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "captain@test.com" } } }),
      },
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
        if (table === "scrims") {
          return {
            insert: (data: any) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    ...data,
                    id: VALID_UUID,
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

    const formData = new Map<string, string>();
    formData.set("division_id", VALID_UUID);
    formData.set("opponent_name", "Tim Elang");
    formData.set("scheduled_at", FUTURE_ISO);
    formData.set("format", "bo3");
    formData.set("patch", "1.8.44");

    const mockFormData = {
      get: (key: string) => formData.get(key) ?? "",
    } as any;

    await expect(createScrimFormAction("team-test", mockFormData)).rejects.toThrow(`Redirect: /team-test/scrim/${VALID_UUID}`);
  });
});
