/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { finishScrimAction } from "@/features/scrim/actions/finishScrimAction";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

function makeAuth(email: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email } } }),
    },
  } as any;
}

function makeAdmin(membershipRole: string | null) {
  return {
    from: (table: string) => {
      if (table === "scrims") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "scrim-1", status: "scheduled", organization_id: "org-1" },
              }),
            }),
          }),
          update: () => ({
            eq: () => ({ neq: async () => ({ error: null }) }),
          }),
        };
      }
      if (table === "team_members") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: membershipRole ? { role: membershipRole } : null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return { upsert: async () => ({ error: null }) };
    },
  } as any;
}

const baseInput = {
  scrimId: "scrim-1",
  orgSlug: "team-x",
  games: [{ gameNumber: 1, isWin: true, notes: null, imageUrl: null }],
  coachNotes: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OWNER_EMAIL = "global-owner@x.com";
});

describe("finishScrimAction role guard", () => {
  it("allows org owner (team_members role 'owner')", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("creator@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin("owner"));
    const r = await finishScrimAction(baseInput);
    expect(r.ok).toBe(true);
  });

  it("allows coach", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("coach@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin("coach"));
    const r = await finishScrimAction(baseInput);
    expect(r.ok).toBe(true);
  });

  it("allows global owner by OWNER_EMAIL without membership", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("global-owner@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin(null));
    const r = await finishScrimAction(baseInput);
    expect(r.ok).toBe(true);
  });

  it("rejects member role", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("member@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin("member"));
    const r = await finishScrimAction(baseInput);
    expect(r.ok).toBe(false);
  });

  it("rejects non-member", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("outsider@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin(null));
    const r = await finishScrimAction(baseInput);
    expect(r.ok).toBe(false);
  });
});
