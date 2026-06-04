/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleResultPublicAction, updateResultImageAction } from "@/features/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

function mockClient(email: string) {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { email } } }) } } as any;
}

beforeEach(() => { vi.clearAllMocks(); });

describe("toggleResultPublicAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    process.env.ADMIN_EMAIL = "admin@x.com";
    process.env.OWNER_EMAIL = "owner@x.com";
    const result = await toggleResultPublicAction("id-1", true);
    expect(result.ok).toBe(false);
  });

  it("succeeds for owner", async () => {
    process.env.OWNER_EMAIL = "owner@x.com";
    vi.mocked(createClient).mockResolvedValue(mockClient("owner@x.com") as any);
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ update: mockUpdate }) } as any);
    const result = await toggleResultPublicAction("id-1", true);
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ is_public: true });
  });
});

describe("updateResultImageAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    const result = await updateResultImageAction("id-1", "https://example.com/img.jpg");
    expect(result.ok).toBe(false);
  });
});
