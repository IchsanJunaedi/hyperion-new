/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { acceptInviteAction } from "@/app/invite/[token]/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

const TOKEN = "tok-1234567890abcdef";

function makeAuth(email: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email } } }),
      refreshSession: vi.fn().mockResolvedValue({}),
    },
  } as any;
}

function makeAdmin(inviteEmail: string | null, claimSpy?: (payload: unknown) => void) {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  return {
    from: (table: string) => {
      if (table === "organization_invites") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "inv-1",
                  organization_id: "org-1",
                  division_id: null,
                  role: "captain",
                  status: "pending",
                  expires_at: future,
                  email: inviteEmail,
                  phone_wa: null,
                },
                error: null,
              }),
            }),
          }),
          update: (payload: unknown) => {
            claimSpy?.(payload);
            return {
              eq: () => ({
                in: () => ({
                  select: async () => ({ data: [{ id: "inv-1" }], error: null }),
                }),
              }),
            };
          },
        };
      }
      if (table === "team_members") {
        const probe: any = {
          select: () => probe,
          eq: () => probe,
          is: () => probe,
          maybeSingle: async () => ({ data: { id: "tm-1" }, error: null }),
        };
        return probe;
      }
      if (table === "organizations") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { name: "Org", slug: "org" }, error: null }),
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
});

describe("acceptInviteAction email guard (SEC-01)", () => {
  it("rejects when invite is addressed to a different email", async () => {
    const claimSpy = vi.fn();
    vi.mocked(createClient).mockResolvedValue(makeAuth("attacker@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin("victim@x.com", claimSpy));

    const r = await acceptInviteAction(TOKEN);
    expect(r.error).toBe("Undangan ini bukan untuk akun Anda.");
    expect(claimSpy).not.toHaveBeenCalled();
  });

  it("accepts when emails match (full happy path reaches redirect)", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("invited@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin("invited@x.com"));

    await expect(acceptInviteAction(TOKEN)).rejects.toThrow("REDIRECT");
  });

  it("accepts open invite without target email (legacy link invites)", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("anyone@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin(null));

    await expect(acceptInviteAction(TOKEN)).rejects.toThrow("REDIRECT");
  });
});
