/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createManualTodoAction } from "@/features/todos/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
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
      if (table === "team_members") {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          in: () => chain,
          limit: () => chain,
          maybeSingle: async () => ({
            data: membershipRole ? { role: membershipRole } : null,
            error: null,
          }),
        };
        return chain;
      }
      if (table === "manual_todos") {
        return {
          insert: () => ({
            select: () => ({
              maybeSingle: async () => ({ data: { id: "todo-1" }, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as any;
}

const validInput = { title: "Cek kontrak", priority: "medium" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OWNER_EMAIL = "global-owner@x.com";
});

describe("createManualTodoAction org membership guard (SEC-03)", () => {
  it("rejects authenticated non-member of the org", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("outsider@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin(null));
    const r = await createManualTodoAction("org-1", validInput);
    expect(r.ok).toBe(false);
  });

  it("rejects member role (only owner/manager may create)", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("member@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin(null)); // role filter excludes 'member'
    const r = await createManualTodoAction("org-1", validInput);
    expect(r.ok).toBe(false);
  });

  it("allows org manager", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("manager@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin("manager"));
    const r = await createManualTodoAction("org-1", validInput);
    expect(r.ok).toBe(true);
  });

  it("allows org owner (team_members role 'owner')", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("creator@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin("owner"));
    const r = await createManualTodoAction("org-1", validInput);
    expect(r.ok).toBe(true);
  });

  it("allows global owner by OWNER_EMAIL without membership", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("global-owner@x.com"));
    vi.mocked(createAdminClient).mockReturnValue(makeAdmin(null));
    const r = await createManualTodoAction("org-1", validInput);
    expect(r.ok).toBe(true);
  });
});
