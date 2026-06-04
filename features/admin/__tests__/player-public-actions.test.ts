/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { togglePlayerPublicAction } from "@/features/admin/actions";
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

describe("togglePlayerPublicAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    process.env.ADMIN_EMAIL = "admin@x.com";
    process.env.OWNER_EMAIL = "owner@x.com";
    const result = await togglePlayerPublicAction("member-id", true);
    expect(result.ok).toBe(false);
  });

  it("succeeds for admin", async () => {
    process.env.ADMIN_EMAIL = "admin@x.com";
    vi.mocked(createClient).mockResolvedValue(mockClient("admin@x.com") as any);
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ update: vi.fn().mockReturnValue({ eq: mockEq }) }) } as any);
    const result = await togglePlayerPublicAction("member-id", true);
    expect(result.ok).toBe(true);
  });
});
