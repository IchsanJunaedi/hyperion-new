/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAchievement, deleteAchievement } from "@/features/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

function makeMockSupabase(email: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email } } }),
    },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createAchievement", () => {
  it("returns forbidden when not admin or owner", async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase("other@example.com") as any);
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.OWNER_EMAIL = "owner@example.com";
    const result = await createAchievement({
      title: "Juara 1 — Cup",
      achieved_at: "2026-06-01",
    });
    expect(result.ok).toBe(false);
    expect((result as any).message).toBe("Akses ditolak");
  });

  it("succeeds when called by owner", async () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase("owner@example.com") as any);
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn().mockReturnValue({ insert: mockInsert }) } as any);
    const result = await createAchievement({
      title: "Juara 1 — Cup",
      achieved_at: "2026-06-01",
    });
    expect(result.ok).toBe(true);
  });
});

describe("deleteAchievement", () => {
  it("succeeds when called by admin", async () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.OWNER_EMAIL = "owner@example.com";
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase("admin@example.com") as any);
    const mockEqFn = vi.fn().mockResolvedValue({ error: null });
    const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockEqFn });
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ delete: mockDeleteFn }),
    } as any);
    const result = await deleteAchievement("some-id");
    expect(result.ok).toBe(true);
    expect(mockDeleteFn).toHaveBeenCalled();
  });
});
