/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDistinctActors } from "@/features/dashboard/actions/fetchAuditLogs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

function makeAuth(email: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: email ? { id: "user-1", email } : null },
      }),
    },
  } as any;
}

function makeAdmin() {
  return {
    from: (table: string) => {
      if (table === "audit_logs") {
        return {
          select: () => ({
            not: () => ({
              order: () => ({
                limit: async () => ({ data: [{ actor_id: "a1" }], error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            in: async () => ({
              data: [{ id: "a1", display_name: "Actor One", username: null }],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OWNER_EMAIL = "owner@x.com";
});

describe("fetchDistinctActors owner gate (SEC-02)", () => {
  it("returns empty for unauthenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth(null));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin());
    expect(await fetchDistinctActors()).toEqual([]);
  });

  it("returns empty for authenticated non-owner", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("member@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin());
    expect(await fetchDistinctActors()).toEqual([]);
  });

  it("returns actors for global owner", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("owner@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin());
    expect(await fetchDistinctActors()).toEqual([{ id: "a1", name: "Actor One" }]);
  });
});
